import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketStatus, WebSocketMessage } from '../utils/websocket';
import { useAuth } from '../hooks/useAuth';

// Message interface
export interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  receiver: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// Conversation interface
export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    userType: string;
    isOnline?: boolean;
    lastSeen?: string;
  }[];
  lastMessage: Message;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}

// User interface
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  userType: string;
  isOnline?: boolean;
  lastSeen?: string;
}

// Messaging context interface
interface MessagingContextType {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Message[];
  users: User[];
  loading: boolean;
  error: string | null;
  wsStatus: WebSocketStatus;
  onlineUsers: Record<string, boolean>;
  setActiveConversation: (conversationId: string | null) => void;
  sendMessage: (content: string, receiverId: string) => void;
  markAsRead: (messageId: string) => void;
  getConversations: () => void;
  getConversationMessages: (otherUserId: string) => void;
  getUsers: () => void;
  startNewConversation: (userId: string) => void;
  isUserOnline: (userId: string) => boolean;
}

// Create the messaging context
const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

// Messaging provider props
interface MessagingProviderProps {
  children: ReactNode;
}

// Messaging provider component
export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const { user, token, updateUserStatus } = useAuth();
  const { status: wsStatus, messages: wsMessages, connect, disconnect, send, clearMessages } = useWebSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());
  const [hasAttemptedConversationFetch, setHasAttemptedConversationFetch] = useState(false);
  const hasFetchedConversations = React.useRef(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  // Track last request times to prevent spamming
  const lastRequestTime = useRef({
    conversations: 0,
    users: 0,
    messages: 0
  });
  
  // Minimum time between similar requests (in ms)
  const REQUEST_THROTTLE = 5000; // 5 seconds

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (token && wsStatus === WebSocketStatus.CLOSED) {
      console.log('Connecting to WebSocket with token');
      connect(token);
    }
    
    // Only disconnect when the component is unmounting, not on every render
    return () => {
      // We should only disconnect when the entire app is unmounting
      // In normal usage, this should never happen, so we'll log it
      console.log('MessagingProvider is unmounting - this should only happen when the app is closing');
      // disconnect(); // Commented out to prevent unnecessary disconnections
    };
  }, [token, wsStatus, connect]);

  // Get all conversations (memoized to prevent dependency loops)
  const getConversations = useCallback(() => {
    // Throttle requests
    const now = Date.now();
    if (loading || (now - lastRequestTime.current.conversations < REQUEST_THROTTLE)) return;
    
    lastRequestTime.current.conversations = now;
    setLoading(true);
    setError(null);
    
    // Only log on first load or when DEBUG is enabled
    if (!hasFetchedConversations.current) {
      console.log('Fetching conversations...');
      hasFetchedConversations.current = true;
    }
    
    send({
      type: 'get_conversations'
    });
  }, [send, loading]);

  // Get conversation messages (memoized to prevent dependency loops)
  const getConversationMessages = useCallback((otherUserId: string) => {
    // Throttle requests
    const now = Date.now();
    if (loading || (now - lastRequestTime.current.messages < REQUEST_THROTTLE)) return;
    
    lastRequestTime.current.messages = now;
    setLoading(true);
    setError(null);
    
    console.log(`Fetching messages with user ${otherUserId}...`);
    send({
      type: 'get_conversation',
      otherUserId
    });
  }, [send, loading]);

  // Get all users (memoized to prevent dependency loops)
  const getUsers = useCallback(() => {
    // Throttle requests
    const now = Date.now();
    if (loading || (now - lastRequestTime.current.users < REQUEST_THROTTLE)) return;
    
    lastRequestTime.current.users = now;
    setLoading(true);
    setError(null);
    
    console.log('Fetching users...');
    send({
      type: 'get_users'
    });
  }, [send, loading]);
  
  // Periodically check if users and conversations are loaded
  useEffect(() => {
    if (wsStatus === WebSocketStatus.OPEN) {
      // Initial fetch when connected (only do this once)
      if (conversations.length === 0 && !hasAttemptedConversationFetch) {
        console.log('No conversations loaded, fetching conversations...');
        getConversations();
        setHasAttemptedConversationFetch(true);
      }
      
      // Periodic check with reduced logging
      const checkDataInterval = setInterval(() => {
        if (conversations.length === 0 && !loading && !hasAttemptedConversationFetch) {
          // Use console.debug instead for less noise
          console.debug('Checking for conversations again...');
          getConversations();
          setHasAttemptedConversationFetch(true);
        }
      }, 60000); // Increase to 1 minute to reduce frequency
      
      return () => clearInterval(checkDataInterval);
    }
  }, [wsStatus, conversations.length, getConversations, loading, hasAttemptedConversationFetch]);

  // Poll for active users status periodically
  useEffect(() => {
    if (wsStatus === WebSocketStatus.OPEN && user) {
      // Poll for users and conversations every 30 seconds to keep status up to date
      const statusInterval = setInterval(() => {
        getUsers();
        getConversations();
        console.log('Polling for updated user statuses');
      }, 30000);
      
      return () => clearInterval(statusInterval);
    }
  }, [wsStatus, user, getUsers, getConversations]);

  // Handle WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestMessage = wsMessages[wsMessages.length - 1];
      
      // Check if we've already processed this message
      if (latestMessage.messageId && processedMessageIds.has(latestMessage.messageId)) {
        return;
      }
      
      // Add the message ID to the set of processed messages
      if (latestMessage.messageId) {
        setProcessedMessageIds(prev => new Set([...prev, latestMessage.messageId!]));
      }
      
      console.log('Received WebSocket message:', latestMessage.type);
      
      // Handle different message types
      switch (latestMessage.type) {
        case 'auth_success':
          // When successfully authenticated, set current user as online and get data
          if (user) {
            updateUserStatus(true);
            
            // Request the current online status of all users
            setTimeout(() => {
              console.log('Getting initial user data after auth');
              getUsers();
              getConversations();
            }, 500);
          }
          break;
          
        case 'auth_error':
          setError('Authentication failed: ' + (latestMessage.message || ''));
          setLoading(false);
          break;
          
        case 'all_conversations':
        case 'conversations':
          console.debug(`Received ${latestMessage.conversations?.length || 0} conversations`);
          setConversations(latestMessage.conversations || []);
          break;
          
        case 'all_users':
        case 'users':
          console.debug(`Received ${latestMessage.users?.length || 0} users`);
          setUsers(latestMessage.users || []);
          break;
          
        case 'conversation_history':
        case 'messages':
          console.log(`Received ${latestMessage.messages?.length || 0} messages`);
          setMessages(latestMessage.messages || []);
          break;
          
        case 'new_message':
          console.log('Received new message');
          handleNewMessage(latestMessage.message);
          break;
          
        case 'message_sent':
          console.log('Message sent successfully:', latestMessage);
          setLoading(false);
          
          // If this is the first message in a conversation, we might need to update our active conversation
          if (latestMessage.conversationId && activeConversation && activeConversation.startsWith('temp-')) {
            const tempUserId = activeConversation.substring(5); // Remove "temp-" prefix
            
            // Check if this is the conversation we're currently viewing
            if (tempUserId === latestMessage.message.receiver || tempUserId === latestMessage.message.sender._id) {
              // Update the active conversation to the real conversation ID
              setActiveConversation(latestMessage.conversationId);
              
              // Also update the conversation in our list
              setConversations(prev => {
                const tempIndex = prev.findIndex(c => c._id === activeConversation);
                if (tempIndex >= 0) {
                  const updatedConversations = [...prev];
                  // Update the temporary conversation with the real one
                  // We'll get the full data when we refresh conversations
                  updatedConversations[tempIndex] = {
                    ...updatedConversations[tempIndex],
                    _id: latestMessage.conversationId
                  };
                  return updatedConversations;
                }
                return prev;
              });
              
              // Refresh conversations to get the updated data
              getConversations();
            }
          }
          
          // Check if the message contains conversation data
          if (latestMessage.message) {
            // Add the message to our current message list
            setMessages(prev => {
              // Check if message already exists
              const messageExists = prev.some(m => m._id === latestMessage.message._id);
              if (messageExists) return prev;
              return [...prev, latestMessage.message];
            });
          }
          break;
          
        case 'unread_messages':
          if (latestMessage.messages && latestMessage.messages.length > 0) {
            console.log(`You have ${latestMessage.messages.length} unread messages`);
            // Refresh conversations to show unread count
            getConversations();
          }
          break;
          
        case 'error':
          console.error('Error from server:', latestMessage.message);
          setError(latestMessage.message);
          setLoading(false);
          break;
          
        case 'user_status_change':
          const { user: statusUser, isOnline } = latestMessage;
          console.log(`User status change: ${statusUser.firstName} ${statusUser.lastName} is now ${isOnline ? 'online' : 'offline'}`);
          
          // Update the online users record
          setOnlineUsers(prev => ({
            ...prev,
            [statusUser._id]: isOnline
          }));
          
          // Update users list with online status
          setUsers(prev => {
            // Check if user exists in our list
            const userExists = prev.some(u => u._id === statusUser._id);
            
            if (!userExists) {
              console.log(`Adding new user ${statusUser.firstName} to users list`);
              // Add the user if they're not already in the list
              return [...prev, { ...statusUser, isOnline }];
            }
            
            // Otherwise update the existing user
            return prev.map(u => 
              u._id === statusUser._id 
                ? { ...u, isOnline: isOnline, lastSeen: isOnline ? undefined : new Date().toISOString() } 
                : u
            );
          });
          
          // Also update the user in conversations participants
          setConversations(prev => 
            prev.map(conv => ({
              ...conv,
              participants: conv.participants.map(p => 
                p._id === statusUser._id 
                  ? { ...p, isOnline: isOnline, lastSeen: isOnline ? undefined : new Date().toISOString() } 
                  : p
              )
            }))
          );
          break;
          
        default:
          console.log('Unhandled message type:', latestMessage.type);
          setLoading(false);
      }
      
      setLoading(false);
    }
  }, [wsMessages, processedMessageIds, getConversations, getConversationMessages, getUsers, activeConversation, conversations, user, users.length, updateUserStatus]);

  // Reconnect logic when status changes
  useEffect(() => {
    // If connection was closed, try to reconnect after a delay
    if (wsStatus === WebSocketStatus.CLOSED && token) {
      const reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        connect(token);
      }, 3000); // Wait 3 seconds before reconnecting
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [wsStatus, token, connect]);

  // Handle new incoming message
  const handleNewMessage = useCallback((message: Message) => {
    // Add message to current conversation if it's active
    if (activeConversation) {
      const otherUserId = message.sender._id;
      const activeConversationObj = conversations.find(c => 
        c.participants.some(p => p._id === otherUserId)
      );
      
      if (activeConversationObj) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(m => m._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
        
        // Mark message as read
        markAsRead(message._id);
      }
    }
    
    // Update conversations list
    updateConversationWithMessage(message);
    
    // Refresh conversations list to ensure it's up to date
    getConversations();
  }, [activeConversation, conversations, getConversations]);

  // Update conversation with new message
  const updateConversationWithMessage = useCallback((message: Message) => {
    const senderId = message.sender._id;
    const isFromCurrentUser = senderId === user?._id;
    const otherUserId = isFromCurrentUser ? message.receiver : senderId;
    
    // Find if conversation exists
    const existingConversationIndex = conversations.findIndex(c => 
      c.participants.some(p => p._id === otherUserId)
    );
    
    if (existingConversationIndex >= 0) {
      // Update existing conversation
      const updatedConversations = [...conversations];
      updatedConversations[existingConversationIndex] = {
        ...updatedConversations[existingConversationIndex],
        lastMessage: message,
        updatedAt: message.createdAt,
        unreadCount: isFromCurrentUser ? 0 : (updatedConversations[existingConversationIndex].unreadCount || 0) + 1
      };
      
      // Sort conversations by updatedAt
      updatedConversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setConversations(updatedConversations);
    }
  }, [conversations, user]);

  // Send a message
  const sendMessage = useCallback((content: string, receiverId: string) => {
    if (!content.trim()) return;
    
    send({
      type: 'send_message',
      receiverId,
      content,
      messageId: `temp-${Date.now()}`
    });
  }, [send]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    // Remove the prefix if we're sending a prefixed ID
    const cleanMessageId = messageId.startsWith('read-') ? messageId.substring(5) : messageId;
    
    send({
      type: 'mark_read',
      messageId: cleanMessageId  // Send the clean ID without the prefix
    });
  }, [send]);

  // Start a new conversation with a user
  const startNewConversation = useCallback((userId: string) => {
    // Find if we already have a conversation with this user
    const existingConversation = conversations.find(c => 
      c.participants.some(p => p._id === userId)
    );
    
    if (existingConversation) {
      // If conversation exists, just set it as active
      setActiveConversation(existingConversation._id);
    } else {
      // If no conversation exists, we'll create one by sending a message
      // First, set up the UI to show we're starting a conversation
      const selectedUser = users.find(u => u._id === userId);
      
      if (selectedUser) {
        // Create a temporary conversation object
        const tempConversation: Conversation = {
          _id: `temp-${userId}`,
          participants: [
            {
              _id: user?._id || '',
              firstName: user?.firstName || '',
              lastName: user?.lastName || '',
              profileImage: user?.profileImage,
              userType: user?.userType || '',
              isOnline: false,
              lastSeen: undefined
            },
            {
              _id: selectedUser._id,
              firstName: selectedUser.firstName,
              lastName: selectedUser.lastName,
              profileImage: selectedUser.profileImage,
              userType: selectedUser.userType,
              isOnline: false,
              lastSeen: undefined
            }
          ],
          lastMessage: {
            _id: 'temp',
            sender: {
              _id: user?._id || '',
              firstName: user?.firstName || '',
              lastName: user?.lastName || ''
            },
            receiver: selectedUser._id,
            content: 'Start a conversation...',
            read: true,
            createdAt: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add this temporary conversation to the list
        setConversations(prev => [tempConversation, ...prev]);
        
        // Set it as active
        setActiveConversation(tempConversation._id);
        
        // Clear messages since this is a new conversation
        setMessages([]);
      }
    }
  }, [conversations, users, user]);

  // Set active conversation and load messages
  const handleSetActiveConversation = useCallback((conversationId: string | null) => {
    setActiveConversation(conversationId);
    
    if (conversationId) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        // Find the other user in the conversation
        const otherUser = conversation.participants.find(p => p._id !== user?._id);
        if (otherUser) {
          getConversationMessages(otherUser._id);
        }
      } else {
        // If there's no conversation object yet (e.g., temporary conversation)
        // Try to extract user ID from the temporary ID format "temp-{userId}"
        if (conversationId.startsWith('temp-')) {
          const otherUserId = conversationId.substring(5); // Remove "temp-" prefix
          if (otherUserId) {
            getConversationMessages(otherUserId);
          }
        }
      }
    } else {
      setMessages([]);
    }
  }, [conversations, user, getConversationMessages]);

  // Helper function to check if a user is online
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers[userId] || false;
  }, [onlineUsers]);

  // When receiving users list from the server, process and update online status
  const processUserData = (userData: User): User => {
    return {
      ...userData,
      isOnline: onlineUsers[userData._id] || false
    };
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    users,
    loading,
    error,
    wsStatus,
    onlineUsers,
    setActiveConversation: handleSetActiveConversation,
    sendMessage,
    markAsRead,
    getConversations,
    getConversationMessages,
    getUsers,
    startNewConversation,
    isUserOnline
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

// Hook to use the messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}; 