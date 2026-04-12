import React, { useState } from "react";
import { Badge, Button, Input, Modal, Select, Table, Tag, Form, message } from "antd";
import { PlusOutlined, MessageOutlined } from "@ant-design/icons";

const { TextArea } = Input;

type Status = "open" | "in_progress" | "resolved" | "closed";
type Priority = "low" | "medium" | "high" | "urgent";

interface Ticket {
  id: string;
  customer: string;
  email: string;
  subject: string;
  category: string;
  priority: Priority;
  status: Status;
  created: string;
  lastReply: string;
  messages: { from: string; text: string; time: string }[];
}

const MOCK_TICKETS: Ticket[] = [
  { id: "TK-001", customer: "Cung Văn Thắng", email: "thang@gmail.com", subject: "MacBook bị lỗi màn hình sau 2 ngày", category: "Sản phẩm lỗi", priority: "urgent", status: "open", created: "03/03/2026", lastReply: "vừa xong", messages: [{ from: "Cung Văn Thắng", text: "Tôi mua MacBook Pro 14 inch M3 được 2 ngày thì màn hình bị sọc xanh. Tôi cần đổi máy ngay lập tức.", time: "10:30 03/03" }] },
  { id: "TK-002", customer: "Nguyễn Thị Lan", email: "lan.nt@gmail.com", subject: "Chưa nhận được hoàn tiền", category: "Thanh toán", priority: "high", status: "in_progress", created: "01/03/2026", lastReply: "2 giờ trước", messages: [{ from: "Nguyễn Thị Lan", text: "Tôi đã huỷ đơn hàng #DH1770 từ 5 ngày trước nhưng chưa nhận được tiền hoàn.", time: "09:00 01/03" }, { from: "Admin", text: "Xin chào chị Lan, chúng tôi đã kiểm tra và đang tiến hành hoàn tiền trong 3-5 ngày làm việc.", time: "11:00 01/03" }] },
  { id: "TK-003", customer: "Trần Minh Long", email: "long.tm@gmail.com", subject: "Không áp dụng được mã giảm giá", category: "Tài khoản", priority: "medium", status: "resolved", created: "28/02/2026", lastReply: "1 ngày trước", messages: [{ from: "Trần Minh Long", text: "Mã PANDORA20 báo lỗi khi tôi cố áp dụng cho đơn 500k.", time: "14:00 28/02" }, { from: "Admin", text: "Mã PANDORA20 yêu cầu đơn hàng tối thiểu 1.000.000đ. Anh vui lòng kiểm tra lại nhé.", time: "15:30 28/02" }, { from: "Trần Minh Long", text: "À hiểu rồi, cảm ơn admin!", time: "16:00 28/02" }] },
  { id: "TK-004", customer: "Phạm Thu Hà", email: "ha.pt@gmail.com", subject: "Muốn hỏi về chính sách bảo hành", category: "Bảo hành", priority: "low", status: "closed", created: "25/02/2026", lastReply: "5 ngày trước", messages: [{ from: "Phạm Thu Hà", text: "iPhone 15 của tôi mua cách đây 8 tháng, bảo hành còn không?", time: "09:00 25/02" }, { from: "Admin", text: "iPhone mua tại Pandora Pro được bảo hành 12 tháng chính hãng. Máy của bạn còn 4 tháng bảo hành.", time: "10:00 25/02" }] },
  { id: "TK-005", customer: "Lê Quang Huy", email: "huy.lq@gmail.com", subject: "Đơn hàng bị delay 10 ngày", category: "Vận chuyển", priority: "high", status: "in_progress", created: "02/03/2026", lastReply: "3 giờ trước", messages: [{ from: "Lê Quang Huy", text: "Đơn hàng iPad Pro M4 của tôi đã hơn 10 ngày mà chưa nhận được, tracking không cập nhật.", time: "08:00 02/03" }] },
];

const STATUS_META: Record<Status, { label: string; color: string }> = {
  open:        { label: "Mở",          color: "blue"    },
  in_progress: { label: "Đang xử lý", color: "orange"  },
  resolved:    { label: "Đã giải quyết", color: "green" },
  closed:      { label: "Đóng",        color: "default" },
};

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  urgent: { label: "Khẩn cấp", color: "red"    },
  high:   { label: "Cao",      color: "orange" },
  medium: { label: "Vừa",      color: "blue"   },
  low:    { label: "Thấp",     color: "default" },
};

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  const visible = filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus);
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;

  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    const now = new Date().toLocaleString("vi-VN");
    const newMsg = { from: "Admin", text: reply.trim(), time: now };
    setTickets((prev) => prev.map((t) =>
      t.id === selected.id
        ? { ...t, messages: [...t.messages, newMsg], lastReply: "vừa xong", status: "in_progress" as Status }
        : t
    ));
    setSelected((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg], status: "in_progress" } : null);
    setReply("");
    message.success("Đã gửi phản hồi");
  };

  const setStatus = (id: string, status: Status) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 90, render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: "Khách hàng", dataIndex: "customer", render: (v: string, r: Ticket) => <><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 12, color: "#9ca3af" }}>{r.email}</div></> },
    { title: "Chủ đề", dataIndex: "subject", ellipsis: true },
    { title: "Danh mục", dataIndex: "category", render: (v: string) => <Tag>{v}</Tag> },
    { title: "Ưu tiên", dataIndex: "priority", render: (v: Priority) => <Tag color={PRIORITY_META[v].color}>{PRIORITY_META[v].label}</Tag> },
    { title: "Trạng thái", dataIndex: "status", render: (v: Status) => <Tag color={STATUS_META[v].color} style={{ borderRadius: 999 }}>{STATUS_META[v].label}</Tag> },
    { title: "Tạo lúc", dataIndex: "created" },
    {
      title: "Thao tác", key: "action",
      render: (_: any, r: Ticket) => (
        <Button size="small" icon={<MessageOutlined />} onClick={() => setSelected(r)}>Xem</Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 700 }}>Hỗ trợ khách hàng</h2>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Ticket mở", value: openCount, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Đang xử lý", value: inProgressCount, color: "#f59e0b", bg: "#fff7ed" },
          { label: "Đã giải quyết", value: tickets.filter((t) => t.status === "resolved").length, color: "#10b981", bg: "#f0fdf4" },
          { label: "Tổng ticket", value: tickets.length, color: "#6b7280", bg: "#f9fafb" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "14px 20px", background: s.bg, borderRadius: 12, minWidth: 140, border: `1px solid ${s.bg}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["all", "open", "in_progress", "resolved", "closed"] as const).map((f) => (
          <Button
            key={f}
            size="small"
            type={filterStatus === f ? "primary" : "default"}
            onClick={() => setFilterStatus(f)}
            style={{ borderRadius: 20 }}
          >
            {f === "all" ? "Tất cả" : STATUS_META[f].label}
            {f === "open" && openCount > 0 && <Badge count={openCount} size="small" style={{ marginLeft: 4, background: "#ef4444" }} />}
          </Button>
        ))}
      </div>

      <div className="card table-card" style={{ marginBottom: selected ? 18 : 0 }}>
        <Table
          columns={columns}
          dataSource={visible.map((t) => ({ ...t, key: t.id }))}
          pagination={{ pageSize: 6, position: ["bottomCenter"] }}
          size="small"
          onRow={(r) => ({ onClick: () => setSelected(r as Ticket), style: { cursor: "pointer", background: selected?.id === r.id ? "#eff6ff" : "" } })}
        />
      </div>

      {/* Ticket detail modal */}
      {selected && (
        <div className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <code style={{ fontSize: 12, color: "#6b7280" }}>{selected.id}</code>
                <Tag color={PRIORITY_META[selected.priority].color}>{PRIORITY_META[selected.priority].label}</Tag>
                <Tag color={STATUS_META[selected.status].color} style={{ borderRadius: 999 }}>{STATUS_META[selected.status].label}</Tag>
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>{selected.subject}</h3>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{selected.customer} · {selected.email}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Select value={selected.status} size="small" style={{ width: 150 }} onChange={(v) => setStatus(selected.id, v)}>
                <Select.Option value="open">Mở</Select.Option>
                <Select.Option value="in_progress">Đang xử lý</Select.Option>
                <Select.Option value="resolved">Đã giải quyết</Select.Option>
                <Select.Option value="closed">Đóng</Select.Option>
              </Select>
              <Button size="small" onClick={() => setSelected(null)}>Thu gọn ✕</Button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 16 }}>
            {selected.messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: m.from === "Admin" ? "row-reverse" : "row",
                gap: 10, marginBottom: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 999, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700,
                  background: m.from === "Admin" ? "#3b82f6" : "#e5e7eb",
                  color: m.from === "Admin" ? "#fff" : "#374151",
                }}>
                  {m.from === "Admin" ? "A" : m.from[0]}
                </div>
                <div style={{ maxWidth: "72%" }}>
                  <div style={{
                    padding: "10px 14px", borderRadius: 12,
                    background: m.from === "Admin" ? "#eff6ff" : "#f9fafb",
                    fontSize: 14, lineHeight: 1.6,
                  }}>{m.text}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, textAlign: m.from === "Admin" ? "right" : "left" }}>{m.from} · {m.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply box */}
          {selected.status !== "closed" && (
            <div style={{ display: "flex", gap: 10 }}>
              <TextArea
                rows={2}
                placeholder="Nhập phản hồi..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendReply(); } }}
                style={{ flex: 1, borderRadius: 8 }}
              />
              <Button type="primary" onClick={sendReply} style={{ height: "auto" }}>Gửi</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
