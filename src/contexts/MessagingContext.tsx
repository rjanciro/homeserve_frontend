import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  setActiveConversation: (conversationId: string | null) => void;
  sendMessage: (content: string, receiverId: string) => void;
  markAsRead: (messageId: string) => void;
  getConversations: () => void;
  getConversationMessages: (otherUserId: string) => void;
  getUsers: () => void;
  startNewConversation: (userId: string) => void;
}

// Create the messaging context
const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

// Messaging provider props
interface MessagingProviderProps {
  children: ReactNode;
}

// Messaging provider component
export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
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
    if (loading) return;
    
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
    // Don't fetch if already loading
    if (loading) return;
    
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
    // Don't fetch if already loading
    if (loading) return;
    
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

  // Handle WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestMessage = wsMessages[wsMessages.length - 1];
      
      // Check if we've already processed this message
      if (latestMessage.messageId && processedMessageIds.has(latestMessage.messageId)) {
        return;
      }
      
      // Skip ping/pong messages
      if (latestMessage.type === 'ping' || latestMessage.type === 'pong' || latestMessage.type === 'welcome') {
        return;
      }
      
      // Add message ID to processed set if it exists
      if (latestMessage.messageId) {
        setProcessedMessageIds(prev => new Set(prev).add(latestMessage.messageId));
      }
      
      console.log('Processing message:', latestMessage.type);
      
      switch (latestMessage.type) {
        case 'auth_success':
          console.log('WebSocket authentication successful');
          // Only fetch if we don't already have data
          if (users.length === 0) getUsers();
          if (conversations.length === 0) getConversations();
          break;
          
        case 'auth_error':
          setError('Authentication failed: ' + (latestMessage.message || ''));
          setLoading(false);
          break;
          
        case 'all_conversations':
        case 'conversations':
          console.log(`Received ${latestMessage.conversations?.length || 0} conversations`);
          setConversations(latestMessage.conversations || []);
          setLoading(false);
          break;
          
        case 'all_users':
        case 'users':
          console.log(`Received ${latestMessage.users?.length || 0} users`);
          setUsers(latestMessage.users || []);
          setLoading(false);
          break;
          
        case 'conversation_history':
        case 'messages':
          console.log(`Received ${latestMessage.messages?.length || 0} messages`);
          setMessages(latestMessage.messages || []);
          setLoading(false);
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
          
        default:
          console.log('Unhandled message type:', latestMessage.type);
          setLoading(false);
      }
    }
  }, [wsMessages, processedMessageIds, getConversations, getConversationMessages, getUsers, activeConversation, conversations, user, users.length]);

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
              userType: user?.userType || ''
            },
            {
              _id: selectedUser._id,
              firstName: selectedUser.firstName,
              lastName: selectedUser.lastName,
              profileImage: selectedUser.profileImage,
              userType: selectedUser.userType
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

  const processUserData = (userData: User): User => {
    if (userData.profileImage && !userData.profileImage.startsWith('http')) {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';
      return {
        ...userData,
        profileImage: `${serverUrl}${userData.profileImage}`
      };
    }
    return userData;
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    users,
    loading,
    error,
    wsStatus,
    setActiveConversation: handleSetActiveConversation,
    sendMessage,
    markAsRead,
    getConversations,
    getConversationMessages,
    getUsers,
    startNewConversation
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