import React, { useState, useEffect, useRef } from "react";
import { Badge, Button, Input, Select, Table, Tag, message, Upload } from "antd";
import { MessageOutlined, SendOutlined, PictureOutlined } from "@ant-design/icons";
import { io, Socket } from "socket.io-client";
import { adminChatApi, getAuthToken } from "../../../utils/apiClient";
import { useAuthStore } from "../../../auth/auth.store";

const { TextArea } = Input;

// Tạo âm thanh cảnh báo (Admin)
const NOTIFICATION_SOUND = new Audio('data:audio/wav;base64,UklGRl9vT19teleGlsbF0IEABAABAAgAIAAAABAAQAAgAAAA==');
try {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  NOTIFICATION_SOUND.playNotification = () => {
    try {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 1200; // Tiếng vang cao hơn cho Admin
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) { /* silent fail */ }
  };
} catch(e) { NOTIFICATION_SOUND.playNotification = () => {}; }

type Status = "active" | "closed" | "pending";

interface Message {
  senderId: string;
  senderType: "user" | "admin";
  message: string;
  attachments: { fileUrl: string; fileName: string }[];
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  _id: string;
  conversationId: string;
  userId: { _id: string; name: string; email: string; avatar?: string };
  messages: Message[];
  status: Status;
  unreadCount: { admin: number; user: number };
  lastMessageAt: string;
}

const SOCKET_URL = "http://localhost:8000/chat-admin";

const STATUS_META: Record<Status, { label: string; color: string }> = {
  active:  { label: "Đang hoạt động", color: "green" },
  pending: { label: "Chờ xử lý",      color: "orange" },
  closed:  { label: "Đã đóng",       color: "default" },
};

export default function Support() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [reply, setReply] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchConversations();

    const token = getAuthToken();
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("new-message", (data: { conversationId: string; message: Message }) => {
      // Báo động Admin nếu có yêu cầu hỗ trợ trực tiếp
      if (data.message?.message?.startsWith('[Hệ thống]') && data.message?.senderType === 'user') {
        try { NOTIFICATION_SOUND.playNotification(); } catch(e) {}
        message.warning({
          content: '⚠️ Có khách hàng đang yêu cầu hỗ trợ trực tiếp!',
          duration: 5,
          style: { fontWeight: 'bold' }
        });
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversationId === data.conversationId
            ? { ...conv, messages: [...conv.messages, data.message], lastMessageAt: data.message.createdAt }
            : conv
        )
      );

      if (selected?.conversationId === data.conversationId) {
        setSelected((prev) =>
          prev ? { ...prev, messages: [...prev.messages, data.message], lastMessageAt: data.message.createdAt } : null
        );
        // Mark as read if user is looking at it
        adminChatApi.markRead(data.conversationId);
      }
    });

    socketRef.current.on("unread-update", (data: { conversationId: string; unreadCount: any }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversationId === data.conversationId ? { ...conv, unreadCount: data.unreadCount } : conv
        )
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [selected?.conversationId]);

  useEffect(scrollToBottom, [selected?.messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await adminChatApi.getConversations();
      if (res.success) {
        setConversations(res.conversations);
      }
    } catch (err) {
      message.error("Không thể tải danh sách hội thoại");
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelected(conv);
    socketRef.current?.emit("join-conversation", conv.conversationId);
    if (conv.unreadCount.admin > 0) {
      adminChatApi.markRead(conv.conversationId);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected || !socketRef.current || !user) return;

    const messageData = {
      conversationId: selected.conversationId,
      message: reply.trim(),
      senderId: user._id,
      senderType: "admin",
      attachments: [],
    };

    socketRef.current.emit("send-message", messageData);
    setReply("");
  };

  const handleUpload = async (file: File) => {
    if (!selected) return false;
    try {
      const res = await adminChatApi.uploadAttachment(file);
      if (res.success) {
        const messageData = {
          conversationId: selected.conversationId,
          message: `Gửi ảnh: ${res.attachment.fileName}`,
          senderId: user?._id || "",
          senderType: "admin",
          attachments: [res.attachment],
        };
        socketRef.current?.emit("send-message", messageData);
      }
    } catch (err) {
      message.error("Tải ảnh thất bại");
    }
    return false;
  };

  const visibleConversations = filterStatus === "all" 
    ? conversations 
    : conversations.filter((c) => c.status === filterStatus);

  const columns = [
    { 
      title: "Khách hàng", 
      dataIndex: "userId", 
      render: (u: any, r: Conversation) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge count={r.unreadCount.admin}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>
              {u?.name?.[0].toUpperCase() || "U"}
            </div>
          </Badge>
          <div>
            <div style={{ fontWeight: 600 }}>{u?.name || "Người dùng"}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{u?.email}</div>
          </div>
        </div>
      ) 
    },
    { 
      title: "Tin nhắn cuối", 
      dataIndex: "messages", 
      render: (msgs: Message[]) => (
        <div style={{ fontSize: 13, color: "#6b7280", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {msgs[msgs.length - 1]?.message || "Chưa có tin nhắn"}
        </div>
      )
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      render: (v: Status) => <Tag color={STATUS_META[v].color}>{STATUS_META[v].label}</Tag> 
    },
    { 
      title: "Cập nhật", 
      dataIndex: "lastMessageAt", 
      render: (v: string) => <span style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(v).toLocaleString()}</span> 
    },
    {
      title: "Thao tác", 
      key: "action",
      render: (_: any, r: Conversation) => (
        <Button size="small" icon={<MessageOutlined />} onClick={() => selectConversation(r)}>Chat</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 700 }}>Hỗ trợ khách hàng</h2>

      <div style={{ display: "flex", gap: 24, minHeight: 600 }}>
        {/* List Sidebar */}
        <div className="card" style={{ width: 400, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 16, borderBottom: "1px solid #f3f4f6" }}>
            <Select defaultValue="all" style={{ width: "100%" }} onChange={(v: any) => setFilterStatus(v)}>
              <Select.Option value="all">Tất cả hội thoại</Select.Option>
              <Select.Option value="active">Đang hoạt động</Select.Option>
              <Select.Option value="pending">Chờ xử lý</Select.Option>
              <Select.Option value="closed">Đã đóng</Select.Option>
            </Select>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Table
              columns={columns}
              dataSource={visibleConversations.map(c => ({ ...c, key: c._id }))}
              pagination={false}
              showHeader={false}
              loading={loading}
              onRow={(r) => ({
                onClick: () => selectConversation(r as Conversation),
                style: { cursor: "pointer", background: selected?._id === r._id ? "#eff6ff" : "" }
              })}
            />
          </div>
        </div>

        {/* Chat Window */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          {selected ? (
            <>
              <div style={{ padding: "12px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0076ff", color: "white" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "white" }}>{selected.userId?.name} <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.8 }}>(Khách hàng trực tuyến)</span></h3>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>{selected.userId?.email}</span>
                </div>
                <Tag color={STATUS_META[selected.status].color} style={{ borderRadius: 12 }}>{STATUS_META[selected.status].label}</Tag>
              </div>

              <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, background: "#eef2f7" }}>
                {selected.messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: m.senderType === "admin" ? "row-reverse" : "row", gap: 12, alignItems: "flex-end" }}>
                    {m.senderType !== "admin" && (
                       <div style={{ width: 32, height: 32, borderRadius: "50%", background: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, border: "1px solid #ddd" }}>
                        {selected.userId?.name?.[0].toUpperCase() || "U"}
                      </div>
                    )}
                    <div style={{
                      maxWidth: "70%", padding: "10px 16px", borderRadius: m.senderType === "admin" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                      background: m.senderType === "admin" ? "#0076ff" : "white",
                      color: m.senderType === "admin" ? "white" : "#333",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      border: m.senderType === "admin" ? "none" : "1px solid #e2e8f0"
                    }}>
                      {m.attachments?.map((att, idx) => (
                        <img key={idx} src={att.fileUrl} alt="attachment" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 8 }} />
                      ))}
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{m.message}</p>
                      
                      {/* AI PRODUCT CARDS IN ADMIN VIEW */}
                      {m.products && m.products.length > 0 && (
                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                          {m.products.map((p: any, idx: number) => (
                            <div key={idx} style={{ display: "flex", gap: 10, background: "#f8fafc", padding: 8, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                              <img src={p.images?.[0]?.url || 'https://via.placeholder.com/150'} alt={p.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: "#ff4d4f" }}>{p.price?.toLocaleString()}đ</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <span style={{ fontSize: 10, opacity: 0.7, marginTop: 4, display: "block", textAlign: m.senderType === "admin" ? "right" : "left" }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", background: "#fff" }}>
                <div style={{ 
                  display: "flex", 
                  gap: 12, 
                  alignItems: "flex-end", 
                  background: "#f5f5f5", 
                  padding: "8px 12px", 
                  borderRadius: 16,
                  border: "1px solid #e5e7eb"
                }}>
                  <Upload beforeUpload={handleUpload} showUploadList={false}>
                    <Button type="text" icon={<PictureOutlined style={{ fontSize: 20, color: "#666" }} />} />
                  </Upload>
                  <TextArea
                    rows={2}
                    placeholder="Nhập nội dung phản hồi..."
                    variant="borderless"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    style={{ background: "transparent", padding: "8px 0" }}
                  />
                  <Button 
                    type="primary" 
                    onClick={sendReply} 
                    style={{ 
                      height: 40, 
                      borderRadius: 20, 
                      background: "#0076ff",
                      fontWeight: 600,
                      padding: "0 24px"
                    }}
                    disabled={!reply.trim()}
                  >
                    Gửi cho
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", background: "#f9fafb" }}>
              <MessageOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
              <p>Chọn một hội thoại hoặc tìm kiếm khách hàng để hỗ trợ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
