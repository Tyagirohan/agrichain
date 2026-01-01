import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, Search, X, Circle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiEndpoint, getWsEndpoint } from '../config/api';

interface Message {
  message_id: string;
  conversation_id: string;
  sender_email: string;
  sender_name: string;
  receiver_email: string;
  receiver_name: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  conversation_id: string;
  other_user: {
    email: string;
    name: string;
    is_online?: boolean;
  };
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const Chat = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadConversations();

    // Connect to WebSocket
    connectWebSocket(userData.email);

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [navigate]);

  const connectWebSocket = (userEmail: string) => {
    const websocket = new WebSocket(getWsEndpoint(`/ws/chat/${userEmail}`));

    websocket.onopen = () => {
      console.log('[CHAT] WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        // New message received
        const message = data.message;
        
        // If this message is from the currently open conversation, add it to messages
        if (selectedConversation && 
            (message.sender_email === selectedConversation.other_user.email ||
             message.receiver_email === selectedConversation.other_user.email)) {
          setMessages(prev => [...prev, message]);
        }
        
        // Refresh conversations list
        loadConversations();
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification(t('newMessage'), {
            body: `${message.sender_name}: ${message.message}`,
            icon: '/vite.svg'
          });
        }
      } else if (data.type === 'typing') {
        // Handle typing indicator
        console.log(`${data.sender_email} is typing...`);
      }
    };

    websocket.onclose = () => {
      console.log('[CHAT] WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(() => connectWebSocket(userEmail), 3000);
    };

    websocket.onerror = (error) => {
      console.error('[CHAT] WebSocket error:', error);
    };

    setWs(websocket);
  };

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiEndpoint('/chat/conversations'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch conversations');
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async (otherUserEmail: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiEndpoint(`/chat/history/${otherUserEmail}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiEndpoint('/chat/send'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_email: selectedConversation.other_user.email,
          receiver_name: selectedConversation.other_user.name,
          message: newMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        loadConversations(); // Refresh to update last message
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('messageFailed'));
    }
  };

  const deleteConversation = async (conversation: Conversation) => {
    if (!window.confirm(t('confirmDeleteConversation'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiEndpoint(`/chat/conversation/${conversation.other_user.email}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.conversation_id !== conversation.conversation_id));
        if (selectedConversation?.conversation_id === conversation.conversation_id) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadChatHistory(conversation.other_user.email);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            💬 {t('messages')}
          </h1>
          <p className="text-xl text-gray-600">{t('chatWithFarmersConsumers')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: '70vh' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchMessages')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t('noConversations')}</p>
                    <p className="text-sm mt-2">{t('startChatting')}</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.conversation_id}
                      onClick={() => selectConversation(conv)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.conversation_id === conv.conversation_id ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-800">{conv.other_user.name}</h3>
                          <Circle
                            className={`w-2 h-2 ${conv.other_user.is_online ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`}
                          />
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-green-500 text-white text-xs font-bold rounded-full px-2 py-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(conv.last_message_time)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selectedConversation.other_user.name}</h2>
                      <div className="flex items-center space-x-2 text-sm">
                        <Circle
                          className={`w-2 h-2 ${selectedConversation.other_user.is_online ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`}
                        />
                        <span className="text-gray-600">
                          {selectedConversation.other_user.is_online ? t('online') : t('offline')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteConversation(selectedConversation)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('deleteConversation')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>{t('noMessages')}</p>
                          <p className="text-sm mt-2">{t('startConversation')}</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwnMessage = msg.sender_email === user?.email;
                        return (
                          <div
                            key={msg.message_id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                                isOwnMessage
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white text-gray-800 shadow'
                              }`}
                            >
                              <p className="break-words">{msg.message}</p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? 'text-green-100' : 'text-gray-400'}`}>
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={t('typeMessage')}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl">{t('selectConversation')}</p>
                    <p className="text-sm mt-2">{t('startChatting')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

