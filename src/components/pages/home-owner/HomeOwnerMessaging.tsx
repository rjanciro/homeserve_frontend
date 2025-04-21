import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { FaSearch, FaUserCircle, FaPaperPlane, FaChevronLeft, FaPlus, FaTimes, FaCircle, FaImage } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useMessaging, Conversation, Message, User } from '../../../contexts/MessagingContext';
import { useAuth } from '../../../hooks/useAuth';
import { WebSocketStatus } from '../../../utils/websocket';
import { profileService } from '../../services/profile.service';
import axios from 'axios';

// Add Online Status Indicator component
const OnlineStatusIndicator: React.FC<{ isOnline?: boolean, className?: string }> = ({ isOnline, className = "" }) => (
  <FaCircle 
    className={`${isOnline ? 'text-green-500' : 'text-gray-400'} text-xs ${className}`} 
  />
);

const HomeOwnerMessaging: React.FC = () => {
  useDocumentTitle('Messages');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
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
    sendImageMessage,
    getConversations,
    getUsers,
    startNewConversation
  } = useMessaging();
  
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [showUsersList, setShowUsersList] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  // Add a reference to track if we've already fetched data for this WebSocket connection
  const hasInitializedRef = useRef<boolean>(false);
  // Track if we've already processed the URL params
  const hasProcessedUrlParams = useRef<boolean>(false);
  // Store providerId from URL
  const providerIdFromUrl = useRef<string | null>(null);
  // Track mount time
  const mountTime = useRef<number>(Date.now());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extract providerId from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const providerId = params.get('providerId');
    if (providerId) {
      providerIdFromUrl.current = providerId;
      console.log('Provider ID extracted from URL:', providerId);
    }
  }, [location.search]);
  
  // Get active conversation object
  const activeConversationObj = activeConversation 
    ? conversations.find(c => c._id === activeConversation) || null
    : null;
  
  // Check screen size for mobile view
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Process URL parameters to start a conversation if providerId is present
  useEffect(() => {
    if (!providerIdFromUrl.current || hasProcessedUrlParams.current) {
      return;
    }
    
    // Only continue if WebSocket is open or if a reasonable time has passed
    if (wsStatus !== WebSocketStatus.OPEN && Date.now() - mountTime.current < 5000) {
      return;
    }
    
    // Add a delay to prevent too frequent calls
    const timer = setTimeout(() => {
      // If we have a providerId from URL but users aren't loaded yet, try to load them once
      if (users.length === 0) {
        console.log('Users not yet loaded, fetching users...');
        getUsers();
        // Don't set hasProcessedUrlParams to true yet, as we still need to start the conversation
        return;
      }
      
      const providerId = providerIdFromUrl.current;
      
      // Add a null check to satisfy TypeScript
      if (!providerId) {
        console.log('Provider ID is null, cannot start conversation');
        return;
      }
      
      console.log('Processing providerId from URL:', providerId);
      
      // First check if we already have a conversation with this provider
      const existingConversation = conversations.find(c => 
        c.participants.some(p => p._id === providerId)
      );
      
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation._id);
        setActiveConversation(existingConversation._id);
        hasProcessedUrlParams.current = true;
        
        // On mobile, hide the conversation list 
        if (mobileView) {
          setShowConversationList(false);
        }
        return;
      }
      
      // If no existing conversation, create a new one
      console.log('No existing conversation found, creating new conversation');
      startNewConversation(providerId);
      hasProcessedUrlParams.current = true;
      
      // On mobile, hide the conversation list 
      if (mobileView) {
        setShowConversationList(false);
      }
    }, 1000); // 1 second delay to prevent infinite loops
    
    return () => clearTimeout(timer);
  }, [users, wsStatus, conversations, startNewConversation, mobileView, getUsers, setActiveConversation]);
  
  // Load conversations and users when WebSocket is open
  useEffect(() => {
    if (wsStatus === WebSocketStatus.OPEN && !hasInitializedRef.current) {
      console.log('HomeOwnerMessaging: WebSocket is open, fetching data (first time)');
      getConversations();
      getUsers();
      // Mark that we've initialized data for this connection
      hasInitializedRef.current = true;
    } else if (wsStatus !== WebSocketStatus.OPEN) {
      // Reset the initialization flag when WebSocket closes
      hasInitializedRef.current = false;
      // Also reset the URL params processing flag when WebSocket closes
      hasProcessedUrlParams.current = false;
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
    
    // Find the selected conversation
    const selectedConversation = conversations.find(c => c._id === conversationId);
    if (selectedConversation) {
      // Find the other user in the conversation
      const otherUser = selectedConversation.participants.find(p => p._id !== user?._id);
      if (otherUser) {
        // Update URL with the provider ID
        // Extract the base path from the current location
        const basePath = location.pathname.split('/').pop() === 'messages' 
          ? location.pathname 
          : '/messages';
        navigate(`${basePath}?providerId=${otherUser._id}`, { replace: true });
      }
    } else if (conversationId.startsWith('temp-')) {
      // Handle temp conversation IDs
      const otherUserId = conversationId.substring(5); // Remove "temp-" prefix
      const basePath = location.pathname.split('/').pop() === 'messages' 
        ? location.pathname 
        : '/messages';
      navigate(`${basePath}?providerId=${otherUserId}`, { replace: true });
    }
    
    // On mobile, hide the conversation list when a conversation is selected
    if (mobileView) {
      setShowConversationList(false);
    }
  };
  
  // Handle selecting a user to start a new conversation
  const handleSelectUser = (userId: string) => {
    startNewConversation(userId);
    
    // Update URL with the provider ID
    const basePath = location.pathname.split('/').pop() === 'messages' 
      ? location.pathname 
      : '/messages';
    navigate(`${basePath}?providerId=${userId}`, { replace: true });
    
    setShowUsersList(false);
    
    // On mobile, hide the conversation list when a conversation is selected
    if (mobileView) {
      setShowConversationList(false);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    const otherUserId = getOtherUserId();
    if (!otherUserId) return;
    
    if (imagePreview && uploadedImageUrl) {
      // Send the uploaded image
      sendImageMessage(uploadedImageUrl, otherUserId);
      // Clear the image preview and uploaded image URL
      setImagePreview(null);
      setUploadedImageUrl(null);
    } else if (messageText.trim()) {
      sendMessage(messageText, otherUserId);
      setMessageText('');
    }
  };
  
  // Handle file selection
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload the image, but don't send it yet
    await uploadImage(file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Upload image to server
  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('chatImage', file);
      
      const response = await axios.post(
        'http://localhost:8080/api/profile/upload-chat-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Store the image URL, but don't send yet
      if (response.data.imageUrl) {
        setUploadedImageUrl(response.data.imageUrl);
      }
      
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
      alert('Failed to upload image');
    }
  };
  
  // Cancel image upload
  const cancelImageUpload = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
  
  // Handle back button click on mobile
  const handleBackToConversationList = () => {
    setShowConversationList(true);
    // Remove the providerId from URL
    navigate(location.pathname, { replace: true });
  };
  
  // Reset URL parameters processing when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && providerIdFromUrl.current && !hasProcessedUrlParams.current) {
      // If we have the provider ID and conversations are loaded, retry processing
      hasProcessedUrlParams.current = false;
    }
  }, [conversations]);
  
  return (
    <div className="h-[calc(90vh-80px)] flex flex-col overflow-hidden">
      {renderConnectionStatus()}
      {error && (
        <div className="bg-red-100 text-red-800 p-1 text-center text-sm">
          {error}
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation/Users List */}
        <div 
          className={`${
            mobileView && !showConversationList ? 'hidden' : 'block'
          } w-full md:w-80 border-r border-gray-200 bg-white flex flex-col`}
        >
          {/* Search Bar - Keep compact */}
          <div className="p-2 border-b border-gray-200 flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={showUsersList ? "Search users..." : "Search conversations..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            </div>
            {showUsersList && (
              <button 
                onClick={() => setShowUsersList(false)}
                className="ml-2 text-gray-500 hover:text-gray-700 p-1"
                title="Back to Conversations"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          {/* List Content - Either Conversations or Users */}
          <div className="flex-1 overflow-y-auto">
            {loading && (conversations.length === 0 || users.length === 0) ? (
              <div className="p-2 text-center text-gray-500 text-sm">
                Loading {showUsersList ? 'users' : 'conversations'}...
              </div>
            ) : showUsersList ? (
              /* Users List */
              filteredUsers.length === 0 ? (
                <div className="p-2 text-center text-gray-500 text-sm">No users found</div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user._id}
                    onClick={() => handleSelectUser(user._id)}
                    className="p-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center"
                  >
                    {/* User content */}
                    <div className="flex-shrink-0 mr-2 relative">
                      {user.profileImage ? (
                        <img 
                          src={profileService.getFullImageUrl(user.profileImage)} 
                          alt={user.firstName} 
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://via.placeholder.com/40"; // Fallback image
                            console.log("Failed to load image:", user.profileImage);
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <FaUserCircle className="text-gray-500 w-8 h-8" />
                        </div>
                      )}
                      <OnlineStatusIndicator isOnline={user.isOnline} className="absolute bottom-0 right-0" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 text-sm">
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
                <div className="p-2 text-center text-gray-500 text-sm">No conversations found</div>
              ) : (
                filteredConversations.map(conversation => {
                  const otherUser = conversation.participants.find(p => p._id !== user?._id);
                  if (!otherUser) return null;
                  
                  return (
                    <div
                      key={conversation._id}
                      onClick={() => handleSelectConversation(conversation._id)}
                      className={`p-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center ${
                        activeConversation === conversation._id ? 'bg-green-50' : ''
                      }`}
                    >
                      {/* User Avatar */}
                      <div className="flex-shrink-0 mr-2 relative">
                        {otherUser.profileImage ? (
                          <img 
                            src={profileService.getFullImageUrl(otherUser.profileImage)} 
                            alt={otherUser.firstName} 
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/40"; // Fallback image
                              console.log("Failed to load image:", otherUser.profileImage);
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUserCircle className="text-gray-500 w-8 h-8" />
                          </div>
                        )}
                        <OnlineStatusIndicator isOnline={otherUser.isOnline} className="absolute bottom-0 right-0" />
                      </div>
                      
                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {`${otherUser.firstName} ${otherUser.lastName}`}
                          </h3>
                          <OnlineStatusIndicator isOnline={otherUser.isOnline} className="ml-1.5 flex-shrink-0" />
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      
                      {/* Time and Unread Badge */}
                      <div className="ml-1 flex flex-col items-end">
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatMessageTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                        {typeof conversation.unreadCount === 'number' && conversation.unreadCount > 0 && (
                          <div className="mt-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className={`${
          mobileView && showConversationList ? 'hidden' : 'flex'
        } flex-1 flex flex-col h-full`}>
          {!activeConversationObj ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
              <FaUserCircle className="text-gray-300 text-3xl mb-2" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white p-2 border-b border-gray-200 flex items-center">
                {mobileView && (
                  <button 
                    onClick={handleBackToConversationList}
                    className="mr-2 text-gray-600"
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>
                )}
                
                {(() => {
                  const otherUser = activeConversationObj.participants.find(p => p._id !== user?._id);
                  if (!otherUser) return null;
                  
                  return (
                    <>
                      <div className="flex-shrink-0 mr-2 relative">
                        {otherUser.profileImage ? (
                          <img 
                            src={profileService.getFullImageUrl(otherUser.profileImage)} 
                            alt={otherUser.firstName} 
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/40"; // Fallback image
                              console.log("Failed to load image:", otherUser.profileImage);
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUserCircle className="text-gray-500 w-8 h-8" />
                          </div>
                        )}
                        <OnlineStatusIndicator isOnline={otherUser.isOnline} className="absolute bottom-0 right-0" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h2 className="font-medium text-gray-900 text-sm">
                            {`${otherUser.firstName} ${otherUser.lastName}`}
                          </h2>
                          <OnlineStatusIndicator isOnline={otherUser.isOnline} className="ml-1.5" />
                        </div>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {otherUser.userType === 'housekeeper' ? 'Housekeeper' : 'Homeowner'}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                {loading && messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-2">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-2">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map(message => {
                    const isCurrentUser = message.sender._id === user?._id;
                    
                    return (
                      <div 
                        key={message._id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] rounded-lg p-2.5 ${
                            isCurrentUser 
                              ? 'bg-green-500 text-white rounded-br-none' 
                              : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          {message.messageType === 'image' && message.imageUrl ? (
                            <div className="mb-1">
                              <img 
                                src={`http://localhost:8080${message.imageUrl}`}
                                alt="Message attachment" 
                                className="max-w-full rounded-lg cursor-pointer"
                                onClick={() => window.open(`http://localhost:8080${message.imageUrl}`, '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://via.placeholder.com/400x300?text=Image+Failed+to+Load";
                                }}
                              />
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
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
              <div className="bg-white p-2 border-t border-gray-200">
                {imagePreview && (
                  <div className="relative mb-2 inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-32 rounded-lg border border-gray-200" 
                    />
                    <button
                      onClick={cancelImageUpload}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-green-500"
                    disabled={!!imagePreview}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-100 text-gray-600 px-3 py-1.5 border-t border-b border-gray-200 hover:bg-gray-200 focus:outline-none"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <FaImage />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    type="submit"
                    disabled={(!messageText.trim() && !imagePreview) || isUploading}
                    className="bg-green-500 text-white px-3 py-1.5 rounded-r-lg hover:bg-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
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

export default HomeOwnerMessaging;
