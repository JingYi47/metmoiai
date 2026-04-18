import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { FiImage, FiX, FiMessageCircle, FiGlobe, FiUser, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { QUICK_QUESTIONS } from './faqData';
import axios from 'axios';
import { cartApi, orderApi, aiApi } from '../../services/api';
import './ChatFloating.css';

const SOCKET_URL = 'http://localhost:8000/chat-admin';
const API_BASE_URL = 'http://localhost:8000/api/v1/chat-admin';

// Tạo âm thanh thông báo (base64 beep)
const NOTIFICATION_SOUND = new Audio('data:audio/wav;base64,UklGRl9vT19teleGlsbF0IEABAABAAgAIAAAABAAQAAgAAAA==');
try {
  // Fallback: tạo AudioContext nếu base64 không hoạt động
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  NOTIFICATION_SOUND.playNotification = () => {
    try {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch(e) { /* silent fail */ }
  };
} catch(e) { NOTIFICATION_SOUND.playNotification = () => {}; }

export default function ChatFloating() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFAQ, setShowFAQ] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const isHumanModeRef = useRef(false);
  const humanInactivityTimerRef = useRef(null);

  const endHumanMode = useCallback((reason) => {
    isHumanModeRef.current = false;
    if (humanInactivityTimerRef.current) clearTimeout(humanInactivityTimerRef.current);
    
    setMessages(prev => [...prev, {
      message: reason === 'admin_idle' 
        ? "⏳ Nhân viên hỗ trợ hiện đang bận hoặc quá tải. Trợ lý AI Pandora sẽ tự động tiếp quản cuộc trò chuyện nhé!"
        : "⏳ Cuộc trò chuyện đã đóng do không có tương tác nào mới. Hệ thống tự động chuyển về hỗ trợ Bot AI.",
      senderType: 'admin',
      createdAt: new Date().toISOString(),
      isSystem: true
    }]);
  }, []);

  const resetInactivityTimer = useCallback((waitingFor) => {
    if (humanInactivityTimerRef.current) clearTimeout(humanInactivityTimerRef.current);
    humanInactivityTimerRef.current = setTimeout(() => {
      endHumanMode(waitingFor);
    }, 30000); // 30s timeout
  }, [endHumanMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Phát âm thanh thông báo
  const playNotification = useCallback(() => {
    if (!isOpen) setUnreadCount(prev => prev + 1);
    try { NOTIFICATION_SOUND.playNotification(); } catch(e) {}
  }, [isOpen]);

  // Socket connection effect
  useEffect(() => {
    if (!isOpen) return;

    const currentToken = token || localStorage.getItem('token');

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log('Initializing chat socket with new token...');
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat socket successfully');
      if (conversation) {
        socketRef.current.emit('join-conversation', conversation.conversationId);
      }
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socketRef.current.on('new-message', (data) => {
      // Ẩn tin nhắn hệ thống khỏi UI của User
      if (data.message?.message?.startsWith('[Hệ thống]') && data.message?.senderType === 'user') {
        return;
      }
      
      // Bỏ qua tin nhắn do chính user gửi truyền về từ Server (tránh duplicate Optimistic UI)
      if (data.senderType === 'user' || data.message?.senderType === 'user') {
        return;
      }

      setMessages((prev) => [...prev, data.message]);

      // Nếu là admin phản hồi, reset timer 30s để chờ lượt user trả lời
      if (data.senderType === 'admin' || data.message?.senderType === 'admin') {
        if (isHumanModeRef.current) {
          resetInactivityTimer('user_idle');
        }
      }

      scrollToBottom();
    });

    socketRef.current.on('user-typing', (data) => {
      if (data.userType === 'admin') {
        setIsTyping(data.isTyping);
      }
    });

    socketRef.current.on('error', (err) => {
      console.error('Socket business error:', err.message);
    });

    fetchHistory();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (humanInactivityTimerRef.current) clearTimeout(humanInactivityTimerRef.current);
    };
  }, [isOpen, user, token]);

  // Open chat event listener
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (conversation && socketRef.current) {
      socketRef.current.emit('join-conversation', conversation.conversationId);
    }
  }, [conversation]);

  useEffect(scrollToBottom, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setConversation(res.data.conversation);
        const fetchedMessages = res.data.conversation.messages || [];
        if (fetchedMessages.length === 0) {
          setMessages([{
            message: '👋 Chào bạn! Mình là trợ lý ảo của Pandora. Bạn cần hỗ trợ tư vấn sản phẩm, mua sắm hay tra cứu đơn hàng nào?',
            senderType: 'admin',
            createdAt: new Date().toISOString()
          }]);
        } else {
          setMessages(fetchedMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSendMessage = async (e, forceMessage = null, contextId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Sửa lỗi: Chỉ lấy forceMessage nếu nó là một chuỗi (Smart Chip), nếu không thì lấy từ inputText
    const currentMessage = (typeof forceMessage === 'string' && forceMessage) ? forceMessage : inputText.trim();
    
    if ((!currentMessage && !isUploading) || isSending) return;

    setIsSending(true);
    if (forceMessage === null) setInputText(''); // Chỉ clear input nếu người dùng tự gõ

    // 1. HIỆN TIN NHẮN USER NGAY LẬP TỨC (Optimistic UI)
    const userMsg = {
      message: currentMessage,
      senderType: 'user',
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    // 2. GỬI QUA SOCKET CHO ADMIN (best-effort, không chặn AI)
    try {
      if (socketRef.current && socketRef.current.connected && conversation) {
        socketRef.current.emit('send-message', {
          conversationId: conversation.conversationId,
          message: currentMessage,
          senderId: user?._id || 'guest',
          senderType: 'user',
          attachments: []
        });
      }
    } catch (socketErr) {
      console.warn('Socket send failed (non-blocking):', socketErr.message);
    }

    if (isHumanModeRef.current) {
      // Đang ở chế độ nhân viên, chờ nhân viên trả lời (không gọi AI)
      resetInactivityTimer('admin_idle');
      setIsSending(false);
      return;
    }

    // 3. GỌI AI ASSISTANT TRỰC TIẾP (không phụ thuộc socket)
    setIsTyping(true); // Hiện "Bot đang trả lời..."
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      // Sử dụng API_BASE_URL gốc để đảm bảo đồng bộ với các API khác
      const aiRes = await axios.post(API_BASE_URL.replace('/chat-admin', '/chat'), {
        message: currentMessage,
        contextProductId: contextId
      }, {
        headers: headers,
        timeout: 30000
      });

      if (aiRes.data.success) {
        const hasProduct = !!aiRes.data.product;
        const botMsg = {
          message: aiRes.data.reply,
          senderType: 'admin',
          createdAt: new Date().toISOString(),
          products: hasProduct ? [aiRes.data.product] : [],
          smartChips: hasProduct ? ["Sản phẩm này có bảo hành không?", "Có màu nào khác không?", "Xem đánh giá của khách hàng"] : []
        };
        setMessages(prev => [...prev, botMsg]);
        playNotification();
      } else {
        // API trả về nhưng không success
        setMessages(prev => [...prev, {
          message: aiRes.data.reply || 'Xin lỗi, tôi chưa hiểu câu hỏi. Bạn có thể diễn đạt lại không?',
          senderType: 'admin',
          createdAt: new Date().toISOString()
        }]);
      }
    } catch (aiErr) {
      console.error('AI Assistant failed:', aiErr.message);
      setMessages(prev => [...prev, {
        message: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau giây lát hoặc chọn "Trò chuyện trực tiếp với nhân viên" bên trên.',
        senderType: 'admin',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false); // Tắt "Bot đang trả lời..."
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (!user) {
      alert("⚠️ Vui lòng đăng nhập để sử dụng tính năng tìm kiếm bằng hình ảnh!");
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    e.target.value = ''; // Reset input để có thể gửi lại cùng 1 ảnh

    try {
      const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });

      if (res.data.success) {
        const attachment = res.data.attachment;
        const messageData = {
          conversationId: conversation?.conversationId,
          message: `[Hình ảnh] ${attachment.fileName}`,
          senderId: user?._id || 'guest',
          senderType: 'user',
          attachments: [attachment],
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, messageData]);

        if (socketRef.current && socketRef.current.connected && conversation) {
          socketRef.current.emit('send-message', messageData);
        }

        if (isHumanModeRef.current) {
          resetInactivityTimer('admin_idle');
          setIsUploading(false);
          return;
        }

        // Tích hợp AI Hình Ảnh
        setIsTyping(true);
        try {
          // Dùng URL để search, nhẹ và nhanh hơn nhiều so với việc upload lại raw file.
          const visualRes = await aiApi.visualSearchByUrl(attachment.fileUrl);
          if (visualRes.success && visualRes.results && visualRes.results.length > 0) {
            const topProducts = visualRes.results.slice(0, 3);
            const botMsg = {
              message: "📷 Hệ thống AI đã nhận diện được hình ảnh của bạn! Đây là các sản phẩm có ngoại hình tương đồng nhất:",
              senderType: 'admin',
              products: topProducts,
              smartChips: ["Có sản phẩm nào rẻ hơn không?", "Sản phẩm này có bảo hành không?", "Tư vấn cấu hình máy này"],
              createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, botMsg]);
            playNotification();
          } else {
            setMessages(prev => [...prev, {
              message: "Xin lỗi, AI chưa tìm thấy sản phẩm nào khớp với hình ảnh của bạn.",
              senderType: 'admin',
              createdAt: new Date().toISOString()
            }]);
          }
        } catch (visErr) {
          console.error("Visual Search failed:", visErr);
          setMessages(prev => [...prev, {
             message: "Lỗi hệ thống khi phân tích hình ảnh.",
             senderType: "admin",
             createdAt: new Date().toISOString()
          }]);
        } finally {
          setIsTyping(false);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuickClick = (item) => {
    // 1. Add User's "click" as a message locally for immediate feedback
    const userMsg = {
      message: item.question,
      senderType: 'user',
      createdAt: new Date().toISOString()
    };
    
    // 2. Add Bot's response locally
    const botMsg = {
      message: item.answer,
      senderType: 'admin', // Label as admin/bot for styling
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg, botMsg]);

    // 3. Xử lý "Tra cứu đơn hàng"
    if (item.id === 'track_order') {
      setIsTyping(true);
      setTimeout(async () => {
        try {
          if (!user) {
            setMessages(prev => [...prev, { message: 'Vui lòng đăng nhập để kiểm tra đơn hàng.', senderType: 'admin', createdAt: new Date().toISOString() }]);
            setIsTyping(false);
            return;
          }
          const ordersRes = await orderApi.getMy();
          const orders = ordersRes.orders || [];
          if (orders.length === 0) {
            setMessages(prev => [...prev, { message: 'Bạn chưa có đơn hàng nào trong hệ thống.', senderType: 'admin', createdAt: new Date().toISOString() }]);
          } else {
            const latestOrder = orders[0];
            let statusText = "Đang xử lý";
            if(latestOrder.orderStatus === "pending") statusText = "Chờ xử lý";
            else if(latestOrder.orderStatus === "processing") statusText = "Đang xử lý";
            else if(latestOrder.orderStatus === "shipped") statusText = "Đang giao hàng";
            else if(latestOrder.orderStatus === "delivered") statusText = "Đã giao";
            else if(latestOrder.orderStatus === "cancelled") statusText = "Đã hủy";
            
            setMessages(prev => [...prev, { 
              message: `📦 Đơn hàng gần nhất của bạn (Mã: **#${latestOrder._id.slice(-6).toUpperCase()}**) đang ở trạng thái: **${statusText}**.\nTổng tiền: ${latestOrder.totalAmount?.toLocaleString()}đ.`, 
              senderType: 'admin', 
              createdAt: new Date().toISOString() 
            }]);
          }
        } catch (err) {
          setMessages(prev => [...prev, { message: 'Có lỗi xảy ra khi tra cứu thông tin đơn hàng.', senderType: 'admin', createdAt: new Date().toISOString() }]);
        } finally {
          setIsTyping(false);
          playNotification();
        }
      }, 1000);
    }

    // 4. If it's the "Chat with staff" option, we might want to also send a flag to server
    if (item.id === 'chat_staff' && socketRef.current && conversation) {
      isHumanModeRef.current = true;
      resetInactivityTimer('admin_idle');

      const socketMsg = {
        conversationId: conversation.conversationId,
        message: "[Hệ thống] Khách hàng yêu cầu hỗ trợ trực tiếp",
        senderId: user?._id || 'guest',
        senderType: 'user',
        attachments: []
      };
      socketRef.current.emit('send-message', socketMsg);
    }
  };

  // Add to cart từ khung chat
  const handleAddToCart = async (p) => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }
    try {
      await cartApi.add(p._id || p.id, 1, p.colors?.[0]?.name || "");
      const successMsg = {
        message: `✅ Đã thêm **${p.name}** vào giỏ hàng thành công!`,
        senderType: 'admin',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, successMsg]);
      playNotification();
    } catch (e) {
      alert("Lỗi: " + e.message);
    }
  };

  return (
    <div className={`chat-floating-container ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chat-trigger" onClick={() => { setIsOpen(true); setUnreadCount(0); }}>
          <FiMessageCircle size={28} />
          <span className="trigger-text">Hỗ trợ</span>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-left">
              <div className="logo-section">
                <span className="logo-text">PANDORA</span>
                <span className="logo-sub">khách hàng trực tuyến</span>
              </div>
            </div>
            <div className="header-right">
              <div className="lang-selector">
                <FiGlobe size={16} />
                <span>Tiếng Việt</span>
              </div>
              <button 
                className={`help-btn ${showFAQ ? 'active' : ''}`} 
                onClick={() => setShowFAQ(!showFAQ)}
                title="Câu hỏi thường gặp"
              >
                <FiHelpCircle size={18} />
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-wrapper ${msg.senderType === 'user' ? 'own' : 'bot'}`}>
                  {msg.senderType !== 'user' && (
                    <div className="bot-avatar">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=support" alt="bot" />
                    </div>
                  )}
                  <div className="message-content">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="message-attachments">
                        {msg.attachments.map((att, i) => (
                          <img key={i} src={att.fileUrl} alt="attachment" className="chat-img" />
                        ))}
                      </div>
                    )}
                    {msg.message && <p>{msg.message}</p>}
                    
                    {/* PRODUCT CARDS IN CHAT */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="chat-product-list">
                        {msg.products.map((p, i) => (
                          <div key={i} className="chat-product-card">
                            <img src={p.images?.[0]?.url || 'https://via.placeholder.com/150'} alt={p.name} />
                            <div className="cp-info">
                              <h4 title={p.name}>{p.name}</h4>
                              <p className="cp-price">{p.price?.toLocaleString()}đ</p>
                              <div className="cp-actions">
                                <a href={`/product/${p.slug}`} className="cp-link" target="_blank" rel="noreferrer">Xem</a>
                                <button className="cp-add-cart" onClick={() => handleAddToCart(p)}>+ Giỏ hàng</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* SMART CHIPS (Chỉ cho tin nhắn của admin/bot) */}
                    {msg.smartChips && msg.smartChips.length > 0 && (
                      <div className="smart-chips-container">
                        {msg.smartChips.map((chip, cIdx) => (
                          <button 
                            key={cIdx} 
                            className="smart-chip-btn" 
                            onClick={() => handleSendMessage(null, chip, msg.products?.[0]?._id || msg.products?.[0]?.slug)}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && <div className="typing-indicator"><span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span> Bot đang trả lời...</div>}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* FAQ OVERLAY SECTION */}
          <div className={`faq-overlay ${showFAQ ? 'show' : ''}`}>
            <div className="faq-overlay-header">
              <span className="faq-overlay-title">Câu hỏi thường gặp</span>
              <button className="faq-overlay-close" onClick={() => setShowFAQ(false)}><FiX size={18} /></button>
            </div>
            <div className="faq-overlay-list">
              {QUICK_QUESTIONS.map((item) => (
                <div 
                  key={item.id} 
                  className="faq-overlay-item" 
                  onClick={() => {
                    handleQuickClick(item);
                    setShowFAQ(false);
                  }}
                >
                  <span className="faq-q-text">{item.question}</span>
                  <span className="faq-arrow">›</span>
                </div>
              ))}
            </div>
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept="image/*"
            />
            <div className="input-group">
              <textarea
                placeholder="Xin vui lòng nhập câu hỏi của bạn ..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
              />
              <div className="input-actions">
                <button type="button" className="action-btn" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <FiImage size={20} />
                </button>
                <button type="submit" className="send-btn-best" disabled={(!inputText.trim() && !isUploading) || isSending}>
                  {isSending ? <div className="spinner" /> : "Gửi"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
