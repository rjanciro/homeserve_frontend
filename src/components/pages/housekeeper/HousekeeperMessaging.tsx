import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaUserCircle, FaPaperPlane, FaChevronLeft, FaPlus, FaTimes, FaCircle } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useMessaging, Conversation, Message, User } from '../../../contexts/MessagingContext';
import { useAuth } from '../../../hooks/useAuth';
import { WebSocketStatus } from '../../../utils/websocket';
import { profileService } from '../../services/profile.service';
import { useLocation } from 'react-router-dom';

// Online Status Indicator component
const OnlineStatusIndicator: React.FC<{ isOnline?: boolean, className?: string }> = ({ isOnline, className = "" }) => (
  <FaCircle 
    className={`${isOnline ? 'text-green-500' : 'text-gray-400'} text-xs ${className}`} 
  />
);

const ServiceProviderMessaging: React.FC = () => {
  useDocumentTitle('Messages');
  const { user } = useAuth();
  const location = useLocation();
  
  const { 
    conversations, 
    activeConversation, 
    messages, 
    users,
    loading, 
    error, 
    wsStatus,
    setActiveConversation, 
    sendMessage, 
    getConversations,
    getUsers,
    startNewConversation
  } = useMessaging();
  
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [showUsersList, setShowUsersList] = useState(false);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Get active conversation object
  const activeConversationObj = activeConversation 
    ? conversations.find(c => c._id === activeConversation) || null
    : null;
  
  // Check for customerId in URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const customerId = searchParams.get('customerId');
    
    if (customerId && wsStatus === WebSocketStatus.OPEN) {
      console.log('Found customerId in URL:', customerId);
      // Start a conversation with this customer
      startNewConversation(customerId);
      
      // On mobile, hide the conversation list when a conversation is started
      if (mobileView) {
        setShowConversationList(false);
      }
    }
  }, [location.search, wsStatus, startNewConversation, mobileView]);
  
  // Check screen size for mobile view
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Load conversations and users when WebSocket is open
  useEffect(() => {
    if (wsStatus === WebSocketStatus.OPEN) {
      console.log('ServiceProviderMessaging: WebSocket is open, fetching data');
      getConversations();
      getUsers();
    }
  }, [wsStatus, getConversations, getUsers]);
  
  // Scroll to bottom of messages when a conversation is selected or a new message is added
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    const otherUser = conversation.participants.find(p => p._id !== user?._id);
    if (!otherUser) return false;
    
    const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  
  // Filter users based on search query
  const filteredUsers = users.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  
  // Get other user ID from active conversation
  const getOtherUserId = () => {
    if (!activeConversationObj || !user) return null;
    const otherUser = activeConversationObj.participants.find(p => p._id !== user._id);
    return otherUser ? otherUser._id : null;
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    
    // On mobile, hide the conversation list when a conversation is selected
    if (mobileView) {
      setShowConversationList(false);
    }
  };
  
  // Handle selecting a user to start a new conversation
  const handleSelectUser = (userId: string) => {
    startNewConversation(userId);
    setShowUsersList(false);
    
    // On mobile, hide the conversation list when a conversation is selected
    if (mobileView) {
      setShowConversationList(false);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !activeConversation) return;
    
    const otherUserId = getOtherUserId();
    if (otherUserId) {
      sendMessage(messageText, otherUserId);
      setMessageText('');
    }
  };
  
  // Format date to readable string
  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Show connection status
  const renderConnectionStatus = () => {
    switch (wsStatus) {
      case WebSocketStatus.CONNECTING:
        return (
          <div className="bg-yellow-100 text-yellow-800 p-2 text-center">
            Connecting to messaging service...
          </div>
        );
      case WebSocketStatus.CLOSED:
        return (
          <div className="bg-red-100 text-red-800 p-2 text-center">
            Disconnected from messaging service. Please refresh the page.
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(93vh-73px)] overflow-hidden">
      {renderConnectionStatus()}
      {error && (
        <div className="bg-red-100 text-red-800 p-2 text-center">
          {error}
        </div>
      )}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Conversation/Users List - Hidden on mobile when a conversation is selected */}
        <div 
          className={`${
            mobileView && !showConversationList ? 'hidden' : 'block'
          } w-full md:w-80 border-r border-gray-200 bg-white h-full overflow-hidden flex flex-col`}
        >
          {/* Search Bar with New Chat Button */}
          <div className="p-4 border-b border-gray-200 flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={showUsersList ? "Search users..." : "Search conversations..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {showUsersList ? (
              <button 
                onClick={() => setShowUsersList(false)}
                className="ml-2 text-gray-500 hover:text-gray-700 p-2"
                title="Back to Conversations"
              >
                <FaTimes />
              </button>
            ) : (
              <button 
                onClick={() => setShowUsersList(true)}
                className="ml-2 bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                title="New Conversation"
              >
                <FaPlus />
              </button>
            )}
          </div>
          
          {/* List Content - Either Conversations or Users */}
          <div className="overflow-y-auto flex-1">
            {loading && (conversations.length === 0 || users.length === 0) ? (
              <div className="p-4 text-center text-gray-500">
                Loading {showUsersList ? 'users' : 'conversations'}...
              </div>
            ) : showUsersList ? (
              /* Users List */
              filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No users found</div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user._id}
                    onClick={() => handleSelectUser(user._id)}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center"
                  >
                    <div className="flex-shrink-0 mr-3 relative">
                      {user.profileImage ? (
                        <img 
                          src={profileService.getFullImageUrl(user.profileImage)} 
                          alt={user.firstName} 
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://via.placeholder.com/40"; // Fallback image
                            console.log("Failed to load image:", user.profileImage);
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <FaUserCircle className="text-gray-500 w-12 h-12" />
                        </div>
                      )}
                      <OnlineStatusIndicator isOnline={user.isOnline} className="absolute bottom-0 right-0" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900">
                          {`${user.firstName} ${user.lastName}`}
                        </h3>
                        <OnlineStatusIndicator isOnline={user.isOnline} className="ml-1.5" />
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {user.userType === 'housekeeper' ? 'Housekeeper' : 'Homeowner'}
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* Conversations List */
              filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No conversations found</div>
              ) : (
                filteredConversations.map(conversation => {
                  const otherUser = conversation.participants.find(p => p._id !== user?._id);
                  if (!otherUser) return null;
                  
                  return (
                    <div
                      key={conversation._id}
                      onClick={() => handleSelectConversation(conversation._id)}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center ${
                        activeConversation === conversation._id ? 'bg-green-50' : ''
                      }`}
                    >
                      {/* User Avatar */}
                      <div className="flex-shrink-0 mr-3 relative">
                        {otherUser.profileImage ? (
                          <img 
                            src={profileService.getFullImageUrl(otherUser.profileImage)} 
                            alt={otherUser.firstName} 
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/40"; // Fallback image
                              console.log("Failed to load image:", otherUser.profileImage);
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUserCircle className="text-gray-500 w-12 h-12" />
                          </div>
                        )}
                        <OnlineStatusIndicator isOnline={otherUser.isOnline} className="absolute bottom-0 right-0" />
                      </div>
                      
                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-900 truncate">
                                {`${otherUser.firstName} ${otherUser.lastName}`}
                              </h3>
                              <OnlineStatusIndicator isOnline={otherUser.isOnline} className="ml-1.5" />
                            </div>
                            {/* {otherUser.userType && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {otherUser.userType === 'provider' ? 'Service Provider' : 'Homeowner'}
                              </span>
                            )} */}
                          </div>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      
                      {/* Unread Badge */}
                      {typeof conversation.unreadCount === 'number' && conversation.unreadCount > 0 && (
                        <div className="ml-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
        
        {/* Chat Area - Hidden on mobile when showing conversation list */}
        <div 
          className={`${
            mobileView && showConversationList ? 'hidden' : 'block'
          } flex-1 flex flex-col bg-gray-50 h-full overflow-hidden`}
        >
          {!activeConversationObj ? (
            // No conversation selected
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <FaUserCircle className="text-gray-300 text-5xl mb-4" />
              <p>Select a conversation to start chatting</p>
              <p className="text-sm mt-2">Or start a new conversation by clicking the + button</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white p-4 border-b border-gray-200 flex items-center flex-shrink-0">
                {mobileView && (
                  <button 
                    onClick={() => setShowConversationList(true)}
                    className="mr-3 text-gray-600"
                  >
                    <FaChevronLeft />
                  </button>
                )}
                
                {(() => {
                  const otherUser = activeConversationObj.participants.find(p => p._id !== user?._id);
                  if (!otherUser) return null;
                  
                  return (
                    <>
                      <div className="flex-shrink-0 mr-3 relative">
                        {otherUser.profileImage ? (
                          <img 
                            src={profileService.getFullImageUrl(otherUser.profileImage)} 
                            alt={otherUser.firstName} 
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/40"; // Fallback image
                              console.log("Failed to load image:", otherUser.profileImage);
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUserCircle className="text-gray-500 w-10 h-10" />
                          </div>
                        )}
                        <OnlineStatusIndicator isOnline={otherUser.isOnline} className="absolute bottom-0 right-0" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h2 className="font-medium text-gray-900">
                            {`${otherUser.firstName} ${otherUser.lastName}`}
                          </h2>
                          <OnlineStatusIndicator isOnline={otherUser.isOnline} className="ml-1.5" />
                        </div>
                        {otherUser.userType && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {otherUser.userType === 'provider' ? 'Service Provider' : 'Homeowner'}
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map(message => {
                    const isCurrentUser = message.sender._id === user?._id;
                    
                    return (
                      <div 
                        key={message._id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] rounded-lg p-3 ${
                            isCurrentUser 
                              ? 'bg-green-500 text-white rounded-br-none' 
                              : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p>{message.content}</p>
                          <div className={`text-xs mt-1 ${isCurrentUser ? 'text-green-100' : 'text-gray-500'}`}>
                            {formatMessageTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="bg-white p-4 border-t border-gray-200 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="bg-green-500 text-white px-4 py-2 rounded-r-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <FaPaperPlane />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderMessaging;
