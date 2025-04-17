import { useEffect, useRef, useState, useCallback } from 'react';

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  messageId?: string;
  [key: string]: any;
}

// WebSocket connection status
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
}

// WebSocket service for handling real-time messaging
export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageListeners: ((message: any) => void)[] = [];
  private statusListeners: ((status: WebSocketStatus) => void)[] = [];
  private processedMessageIds: Set<string> = new Set();
  private lastPongTime: number = Date.now();
  private connectionHealthCheckInterval: NodeJS.Timeout | null = null;
  private connecting: boolean = false;

  private constructor() {}

  // Get singleton instance
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Initialize WebSocket connection
  public connect(token: string): void {
    // Don't try to reconnect if we're already connecting or connected
    if (this.connecting) {
      console.log('Already attempting to connect');
      return;
    }
    
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    // Clear any existing intervals
    this.clearIntervals();
    
    // Set connecting flag
    this.connecting = true;

    this.token = token;
    this.notifyStatusChange(WebSocketStatus.CONNECTING);
    
    // Use secure WebSocket if on HTTPS
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the server's actual IP address or hostname instead of localhost
    const wsUrl = `${protocol}//127.0.0.1:8081`;
    
    console.log('Connecting to WebSocket server at:', wsUrl);
    
    try {
      this.socket = new WebSocket(wsUrl);

      // Set a timeout to prevent hanging in CONNECTING state
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.log('Connection attempt timed out');
          this.socket.close();
          this.socket = null;
          this.connecting = false;
          this.notifyStatusChange(WebSocketStatus.CLOSED);
          this.attemptReconnect();
        }
      }, 10000); // 10 second timeout

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.connecting = false;
        this.notifyStatusChange(WebSocketStatus.OPEN);
        
        // Authenticate with the WebSocket server
        this.send({
          type: 'auth',
          token: this.token,
          messageId: `auth-${Date.now()}`
        });
        
        // Set up ping interval to keep connection alive
        this.setupPingInterval();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Update last pong time for any message received (server is alive)
          this.lastPongTime = Date.now();
          
          // Check if we've already processed this message (if it has an ID)
          if (data.messageId && this.processedMessageIds.has(data.messageId)) {
            console.log('Skipping already processed message:', data.messageId);
            return;
          }
          
          // Add message ID to processed set if it exists
          if (data.messageId) {
            this.processedMessageIds.add(data.messageId);
            
            // Limit the size of the processed message IDs set
            if (this.processedMessageIds.size > 1000) {
              // Remove oldest entries (convert to array, slice, convert back to set)
              const idsArray = Array.from(this.processedMessageIds);
              this.processedMessageIds = new Set(idsArray.slice(idsArray.length - 500));
            }
          }
          
          // Log welcome message but don't notify listeners
          if (data.type === 'welcome') {
            console.log('Received welcome message from server:', data.message);
            return;
          }
          
          this.notifyMessageListeners(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}, Clean: ${event.wasClean}`);
        this.notifyStatusChange(WebSocketStatus.CLOSED);
        this.clearIntervals();
        this.connecting = false;
        
        // Don't attempt to reconnect if the connection was closed cleanly
        if (!event.wasClean) {
          this.attemptReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connecting = false;
        // Don't change status here, let onclose handle it
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.notifyStatusChange(WebSocketStatus.CLOSED);
      this.connecting = false;
      this.attemptReconnect();
    }
  }

  // Set up ping interval to keep connection alive
  private setupPingInterval(): void {
    // Clear any existing ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Send a ping every 15 seconds to keep the connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send a custom ping message
        try {
          this.send({
            type: 'ping',
            timestamp: Date.now(),
            messageId: `ping-${Date.now()}`
          });
        } catch (error) {
          console.error('Error sending ping:', error);
        }
      }
    }, 15000);
  }
  
  // Send a message through the WebSocket
  public send(message: WebSocketMessage): void {
    // Ensure message has an ID to prevent duplicates
    if (!message.messageId) {
      message.messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        // If there's an error sending, the connection might be broken
        this.reconnect();
      }
    } else {
      console.error('WebSocket is not connected. Current state:', this.socket ? this.getReadyStateString(this.socket.readyState) : 'null');
      
      // If we're not connected, try to reconnect
      if (this.token && (!this.socket || this.socket.readyState === WebSocket.CLOSED) && !this.connecting) {
        this.connect(this.token);
      }
    }
  }
  
  // Get readable WebSocket ready state
  private getReadyStateString(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  // Close the WebSocket connection - ONLY call this when explicitly needed
  public disconnect(): void {
    console.log('Explicitly disconnecting WebSocket');
    this.clearIntervals();
    
    if (this.socket) {
      this.notifyStatusChange(WebSocketStatus.CLOSING);
      try {
        this.socket.close(1000, 'Client disconnected normally');
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.socket = null;
    }
    
    this.connecting = false;
  }

  // Add a message listener
  public addMessageListener(listener: (message: any) => void): void {
    this.messageListeners.push(listener);
  }

  // Remove a message listener
  public removeMessageListener(listener: (message: any) => void): void {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  // Add a status listener
  public addStatusListener(listener: (status: WebSocketStatus) => void): void {
    this.statusListeners.push(listener);
  }

  // Remove a status listener
  public removeStatusListener(listener: (status: WebSocketStatus) => void): void {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  // Notify all message listeners
  private notifyMessageListeners(message: any): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  // Notify all status listeners
  private notifyStatusChange(status: WebSocketStatus): void {
    this.statusListeners.forEach(listener => listener(status));
  }

  // Clear all intervals
  private clearIntervals(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.connectionHealthCheckInterval) {
      clearInterval(this.connectionHealthCheckInterval);
      this.connectionHealthCheckInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // Force reconnection
  private reconnect(): void {
    console.log('Forcing reconnection...');
    if (this.socket) {
      // Close the socket if it's still open
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      this.socket = null;
    }
    
    this.connecting = false;
    
    // Attempt to reconnect if we have a token
    if (this.token) {
      this.connect(this.token);
    }
  }

  // Attempt to reconnect to the WebSocket server
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff with a maximum of 30 seconds
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }
}

// React hook for using WebSocket
export const useWebSocket = () => {
  const wsService = useRef<WebSocketService>(WebSocketService.getInstance());
  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.CLOSED);
  const [messages, setMessages] = useState<any[]>([]);
  const isComponentMounted = useRef(true);

  // Connect to WebSocket
  const connect = useCallback((token: string) => {
    if (isComponentMounted.current) {
      wsService.current.connect(token);
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('Explicit disconnect called from useWebSocket hook');
    wsService.current.disconnect();
  }, []);

  // Send a message
  const send = useCallback((message: WebSocketMessage) => {
    wsService.current.send(message);
  }, []);

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      // Skip ping/pong messages to reduce state updates
      if (message.type !== 'ping' && message.type !== 'pong') {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleStatus = (newStatus: WebSocketStatus) => {
      setStatus(newStatus);
    };

    wsService.current.addMessageListener(handleMessage);
    wsService.current.addStatusListener(handleStatus);

    // Set mounted flag
    isComponentMounted.current = true;

    return () => {
      // Set unmounted flag
      isComponentMounted.current = false;
      
      // Remove listeners but don't disconnect
      wsService.current.removeMessageListener(handleMessage);
      wsService.current.removeStatusListener(handleStatus);
      
      // Don't disconnect here - let the service manage its own lifecycle
      // This prevents disconnection when components using this hook unmount
    };
  }, []);

  return {
    status,
    messages,
    connect,
    disconnect,
    send,
    clearMessages: () => setMessages([])
  };
};

export default WebSocketService.getInstance(); 