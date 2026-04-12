import React, { useState, useEffect, useRef } from "react";
import { chatApi } from "../services/api";
import "./ChatWidget.css";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Chào bạn! Tôi có thể giúp gì?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // URL trang web của bạn (có thể thay đổi khi deploy)
  const FRONTEND_URL = "http://localhost:3000";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return;

    const userText = input;
    setMessages((prev) => [...prev, { text: userText, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(userText);

      // AI chỉ cần trả về productId (slug), React sẽ tự nối thành link
      const botReply = response.reply || "Tôi đã nhận được thông tin.";
      const slug = response.productId;

      setMessages((prev) => [
        ...prev,
        {
          text: botReply,
          sender: "bot",
          productId: slug, // Lưu slug lại để render link bên dưới
        },
      ]);
    } catch (error) {
      console.error("Lỗi Chat API:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Rất tiếc, hệ thống đang bận. Vui lòng thử lại sau!",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="chat-widget-wrapper">
      <div className={`chat-container ${isOpen ? "show" : "hide"}`}>
        <div className="chat-header">
          <span className="chat-title">Hỗ trợ trực tuyến</span>
          <button className="close-btn" onClick={toggleChat}>
            ×
          </button>
        </div>

        <div className="chat-window">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}-msg`}>
              <div className="msg-bubble">
                <p>{msg.text}</p>

                {/* TỰ ĐỘNG TẠO LINK NẾU AI TRẢ VỀ PRODUCTID */}
                {msg.sender === "bot" && msg.productId && (
                  <a
                    href={`${FRONTEND_URL}/product/${msg.productId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="product-suggest-link"
                  >
                    Xem sản phẩm ngay ↗
                  </a>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot-msg">
              <div className="msg-bubble">
                <p className="typing-loader">...</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            className="user-input"
            placeholder={isLoading ? "Đang trả lời..." : "Nhập tin nhắn..."}
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={isLoading}
          >
            <span>{isLoading ? "..." : "Gửi"}</span>
          </button>
        </div>
      </div>

      {!isOpen && (
        <button className="chat-icon-bubble" onClick={toggleChat}>
          <div className="inner-icon-wrapper">
            <div className="speech-bubble">
              <div className="eyes">
                <span className="eye"></span>
                <span className="eye"></span>
              </div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
