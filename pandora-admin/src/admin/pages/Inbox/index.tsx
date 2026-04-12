import React, { useState } from "react";
import { Badge, Button, Tag } from "antd";
import {
  ShoppingCartOutlined, GiftOutlined, AlertOutlined,
  UserOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from "@ant-design/icons";

type MsgType = "order" | "promo" | "alert" | "user" | "system";

interface Msg {
  id: number;
  type: MsgType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK: Msg[] = [
  { id: 1, type: "order",  title: "Đơn hàng mới #DH1772522841464", body: "Khách hàng Cung Văn Thắng vừa đặt đơn 47.000.000đ (MacBook Pro 14 M3). Cần xác nhận.", time: "2 phút trước", read: false },
  { id: 2, type: "user",   title: "Người dùng mới đăng ký", body: "nguyen.thi.a@gmail.com vừa đăng ký tài khoản. Hệ thống đã gửi email xác minh.", time: "15 phút trước", read: false },
  { id: 3, type: "alert",  title: "Sản phẩm sắp hết hàng", body: "iPhone 15 Pro Max 256GB Natural Titanium chỉ còn 2 sản phẩm trong kho. Cần nhập thêm hàng.", time: "1 giờ trước", read: false },
  { id: 4, type: "order",  title: "Đơn hàng #DH1770000123 đã được giao", body: "Shipper đã giao thành công đơn hàng cho khách. Trạng thái tự động cập nhật sang 'delivered'.", time: "3 giờ trước", read: true },
  { id: 5, type: "promo",  title: "Coupon PANDORA20 sắp hết hạn", body: "Mã giảm giá PANDORA20 sẽ hết hạn sau 2 ngày (05/03/2026). Cân nhắc gia hạn hoặc tạo mã mới.", time: "5 giờ trước", read: true },
  { id: 6, type: "system", title: "Backup dữ liệu thành công", body: "Hệ thống đã tự động backup MongoDB Atlas lúc 02:00 AM. Dung lượng: 245 MB. Trạng thái: OK.", time: "8 giờ trước", read: true },
  { id: 7, type: "alert",  title: "Tỷ lệ huỷ đơn tăng cao", body: "Tỷ lệ huỷ đơn hàng trong 7 ngày qua tăng 12% so với tuần trước. Kiểm tra lý do huỷ để xử lý.", time: "1 ngày trước", read: true },
  { id: 8, type: "user",   title: "Khiếu nại từ khách hàng #CUS-0042", body: "Khách hàng Trần Minh Long phản ánh về chất lượng AirPods Pro 2. Yêu cầu đổi trả trong 30 ngày.", time: "2 ngày trước", read: true },
];

const TYPE_META: Record<MsgType, { icon: React.ReactNode; color: string; label: string }> = {
  order:  { icon: <ShoppingCartOutlined />, color: "blue",   label: "Đơn hàng" },
  promo:  { icon: <GiftOutlined />,         color: "gold",   label: "Khuyến mãi" },
  alert:  { icon: <AlertOutlined />,        color: "red",    label: "Cảnh báo" },
  user:   { icon: <UserOutlined />,         color: "green",  label: "Người dùng" },
  system: { icon: <CheckCircleOutlined />,  color: "default", label: "Hệ thống" },
};

export default function Inbox() {
  const [msgs, setMsgs] = useState<Msg[]>(MOCK);
  const [filter, setFilter] = useState<"all" | MsgType>("all");
  const [selected, setSelected] = useState<Msg | null>(null);

  const unread = msgs.filter((m) => !m.read).length;
  const filtered = filter === "all" ? msgs : msgs.filter((m) => m.type === filter);

  const open = (msg: Msg) => {
    setSelected(msg);
    if (!msg.read) setMsgs((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m));
  };

  const markAll = () => setMsgs((prev) => prev.map((m) => ({ ...m, read: true })));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Hộp thư</h2>
          {unread > 0 && <Badge count={unread} style={{ background: "#ef4444" }} />}
        </div>
        {unread > 0 && (
          <Button size="small" onClick={markAll} icon={<CheckCircleOutlined />}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "order", "user", "alert", "promo", "system"].map((f) => (
          <Button
            key={f}
            size="small"
            type={filter === f ? "primary" : "default"}
            onClick={() => setFilter(f as any)}
            style={{ borderRadius: 20 }}
          >
            {f === "all" ? `Tất cả${unread > 0 ? ` (${unread})` : ""}` : TYPE_META[f as MsgType]?.label}
          </Button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, minHeight: 520 }}>
        {/* List */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {filtered.map((msg) => {
            const meta = TYPE_META[msg.type];
            return (
              <div
                key={msg.id}
                onClick={() => open(msg)}
                style={{
                  display: "flex", gap: 12, padding: "14px 16px",
                  borderBottom: "1px solid #f3f4f6", cursor: "pointer",
                  background: selected?.id === msg.id ? "#eff6ff" : !msg.read ? "#fffbeb" : "#fff",
                  transition: "background .12s",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 999, display: "grid", placeItems: "center", flexShrink: 0,
                  background: meta.color === "red" ? "#fef2f2" : meta.color === "blue" ? "#eff6ff" : meta.color === "gold" ? "#fffbeb" : meta.color === "green" ? "#f0fdf4" : "#f9fafb",
                  fontSize: 16,
                  color: meta.color === "red" ? "#ef4444" : meta.color === "blue" ? "#3b82f6" : meta.color === "gold" ? "#f59e0b" : meta.color === "green" ? "#10b981" : "#6b7280",
                }}>
                  {meta.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: msg.read ? 500 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {msg.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                    {msg.body}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{msg.time}</span>
                  {!msg.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div className="card card-pad">
          {selected ? (
            <>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: 16, borderBottom: "1px solid #f3f4f6", marginBottom: 16 }}>
                <Tag color={TYPE_META[selected.type].color} style={{ borderRadius: 999, margin: 0 }}>
                  {TYPE_META[selected.type].label}
                </Tag>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>{selected.title}</h3>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{selected.time}</span>
                </div>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "#374151" }}>{selected.body}</p>
              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                {selected.type === "order" && (
                  <Button type="primary" onClick={() => window.open("/orders", "_blank")}>Xem đơn hàng</Button>
                )}
                {selected.type === "user" && (
                  <Button type="primary" onClick={() => window.open("/users", "_blank")}>Xem người dùng</Button>
                )}
                {selected.type === "alert" && (
                  <Button type="primary" danger onClick={() => window.open("/products", "_blank")}>Quản lý sản phẩm</Button>
                )}
                <Button icon={<CloseCircleOutlined />} onClick={() => { setMsgs((p) => p.filter((m) => m.id !== selected.id)); setSelected(null); }}>Xoá</Button>
              </div>
            </>
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#d1d5db", minHeight: 300 }}>
              <span style={{ fontSize: 40 }}>📩</span>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>Chọn một tin nhắn để xem nội dung</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
