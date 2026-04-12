import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Chào Dat! Tôi là trợ lý AI, tôi có thể giúp gì cho bạn?",
      sender: "bot",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 🔥 ĐỔI PORT NẾU BACKEND KHÁC
  const BASE_URL = "http://localhost:3000";

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // =========================
  // SEND MESSAGE
  // =========================
  const handleSend = async (customText) => {
    const textToSend = customText || input;

    if (!textToSend.trim() || loading) return;

    const userMsg = { text: textToSend, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);

    setInput("");
    setLoading(true);

    try {
      console.log("👉 SEND:", textToSend);

      const res = await axios.post(
        `${BASE_URL}/api/v1/chat`,
        { message: textToSend },
        {
          headers: {
            "x-session-id": "dat_session_001",
          },
        },
      );

      console.log("🔥 RESPONSE:", res.data);

      const data = res.data;

      // =========================
      // XỬ LÝ PRODUCTS
      // =========================
      let products = [];

      if (data.products && data.products.length > 0) {
        products = data.products.map((p) => {
          let displayImage = "https://via.placeholder.com/150";

          // ảnh chính
          if (p.images?.length > 0) {
            const img = p.images[0].url;
            displayImage = img.startsWith("http") ? img : BASE_URL + img;
          }
          // fallback
          else if (p.colors?.[0]?.images?.[0]?.url) {
            const img = p.colors[0].images[0].url;
            displayImage = img.startsWith("http") ? img : BASE_URL + img;
          }

          return { ...p, displayImage };
        });
      }

      const botMsg = {
        text: data.reply || "Tôi tìm thấy sản phẩm:",
        sender: "bot",
        products,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("❌ ERROR:", error);

      if (error.response) {
        console.log("STATUS:", error.response.status);
        console.log("DATA:", error.response.data);
      }

      setMessages((prev) => [
        ...prev,
        {
          text: "Không kết nối được backend 😢",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header">
        <span>🤖 Chat AI</span>
      </div>

      {/* CHAT */}
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.sender}`}>
            <div className="message">
              <p>{msg.text}</p>

              {/* PRODUCTS */}
              {msg.products?.length > 0 && (
                <div className="product-list">
                  {msg.products.map((p, i) => (
                    <div key={i} className="product-card">
                      <img
                        src={p.displayImage}
                        alt={p.name}
                        onError={(e) =>
                          (e.target.src = "https://via.placeholder.com/150")
                        }
                      />

                      <h4>{p.name}</h4>
                      <p>
                        {p.price ? p.price.toLocaleString() + " đ" : "Liên hệ"}
                      </p>

                      <a
                        href={`/product/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Xem
                      </a>

                      <button onClick={() => handleSend(p.name)}>
                        Hỏi lại
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && <div className="loading">Đang trả lời...</div>}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <div className="input-area">
        <input
          type="text"
          placeholder="Nhập sản phẩm..."
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button onClick={() => handleSend()} disabled={loading}>
          Gửi
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
