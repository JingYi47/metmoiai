import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button, Descriptions, Select, Spin, Tag, Timeline, message, Divider,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { adminRealOrderApi } from "../../../utils/apiClient";
import { currencyVND } from "../../mocks/db";

const STATUS_OPTIONS = [
  { value: "pending",    label: "Chờ xử lý" },
  { value: "confirmed",  label: "Đã xác nhận" },
  { value: "processing", label: "Đang xử lý" },
  { value: "shipped",    label: "Đang giao" },
  { value: "delivered",  label: "Đã giao" },
  { value: "completed",  label: "Hoàn thành" },
  { value: "cancelled",  label: "Đã huỷ" },
  { value: "returned",   label: "Đã trả hàng" },
];

const STATUS_COLOR: Record<string, string> = {
  pending: "default", confirmed: "blue", processing: "orange",
  shipped: "cyan", delivered: "green", completed: "success",
  cancelled: "red", returned: "volcano",
};

const PAYMENT_LABEL: Record<string, string> = {
  COD: "COD (Nhận hàng trả tiền)", VNPAY: "VNPay",
  MOMO: "Ví MoMo", BANKING: "Chuyển khoản",
};

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Chờ thanh toán" },
  { value: "unpaid", label: "Chưa thanh toán" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "failed", label: "Thanh toán thất bại" },
  { value: "refunded", label: "Hoàn tiền / Refund" },
];

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  pending: "default",
  unpaid: "default",
  paid: "green",
  failed: "red",
  refunded: "volcano",
};

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN");
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminRealOrderApi.getById(id!)
      .then((d: any) => setOrder(d.order ?? d))
      .catch(() => message.error("Không tải được đơn hàng"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: string) => {
    setSaving(true);
    try {
      await adminRealOrderApi.updateStatus(id!, status);
      setOrder((prev: any) => ({ ...prev, status }));
      message.success("Đã cập nhật trạng thái");
    } catch (err: any) {
      message.error(err.message || "Lỗi");
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentStatusChange = async (paymentStatus: string) => {
    setSaving(true);
    try {
      await adminRealOrderApi.updatePaymentStatus(id!, paymentStatus);
      setOrder((prev: any) => ({ ...prev, paymentStatus }));
      message.success("Đã cập nhật trạng thái thanh toán");
    } catch (err: any) {
      message.error(err.message || "Lỗi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>;
  if (!order) return <div style={{ padding: 32 }}>Không tìm thấy đơn hàng</div>;

  const user = order.user ?? {};
  const addr = order.shippingAddress ?? {};
  const statusLabel = STATUS_OPTIONS.find(s => s.value === order.status)?.label ?? order.status;
  const paymentStatusLabel =
    PAYMENT_STATUS_OPTIONS.find((p) => p.value === order.paymentStatus)?.label ?? order.paymentStatus ?? "—";

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/orders")}
          >
            Quay lại
          </Button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              Đơn #{String(order._id).slice(-8).toUpperCase()}
            </h1>
            <span style={{ color: "#6b7280", fontSize: 13 }}>{fmtDate(order.createdAt)}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Select
            value={order.status}
            loading={saving}
            style={{ width: 180 }}
            options={STATUS_OPTIONS}
            onChange={handleStatusChange}
          />
          <Tag color={STATUS_COLOR[order.status] ?? "default"} style={{ fontSize: 13, padding: "4px 12px", borderRadius: 999 }}>
            {statusLabel}
          </Tag>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Products */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Sản phẩm đặt</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", color: "#6b7280", fontSize: 13 }}>
                  <th style={{ textAlign: "left", paddingBottom: 8, fontWeight: 600 }}>Sản phẩm</th>
                  <th style={{ textAlign: "center", paddingBottom: 8, fontWeight: 600 }}>SL</th>
                  <th style={{ textAlign: "right", paddingBottom: 8, fontWeight: 600 }}>Đơn giá</th>
                  <th style={{ textAlign: "right", paddingBottom: 8, fontWeight: 600 }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any, i: number) => {
                  const p = item.product ?? {};
                  const img = p.images?.[0]?.url ?? p.imageUrl ?? "";
                  const rowTotal = item.total ?? item.price * item.quantity;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 10, overflow: "hidden",
                          background: "#f3f4f6", flexShrink: 0, border: "1px solid #e5e7eb"
                        }}>
                          {img
                            ? <img src={img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 20 }}>
                                {(item.name ?? "?")[0]}
                              </div>
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          {item.color && <div style={{ fontSize: 12, color: "#6b7280" }}>Màu: {item.color}</div>}
                        </div>
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", verticalAlign: "middle" }}>{currencyVND(item.price)}</td>
                      <td style={{ textAlign: "right", verticalAlign: "middle", fontWeight: 600 }}>{currencyVND(rowTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Divider style={{ margin: "12px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <span style={{ color: "#6b7280" }}>Tạm tính: <strong>{currencyVND(order.subtotal)}</strong></span>
              <span style={{ color: "#6b7280" }}>Phí vận chuyển: <strong>{order.shippingFee ? currencyVND(order.shippingFee) : "Miễn phí"}</strong></span>
              {order.discount > 0 && <span style={{ color: "#10b981" }}>Giảm giá: <strong>-{currencyVND(order.discount)}</strong></span>}
              <span style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>Tổng: {currencyVND(order.total)}</span>
            </div>
          </div>

          {/* Shipping */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700 }}>Địa chỉ giao hàng</h3>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Người nhận">{addr.fullName ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">{addr.phone ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {[addr.address, addr.ward, addr.district, addr.province ?? addr.city].filter(Boolean).join(", ") || "—"}
              </Descriptions.Item>
              {addr.note && <Descriptions.Item label="Ghi chú">{addr.note}</Descriptions.Item>}
            </Descriptions>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Customer */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700 }}>Khách hàng</h3>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tên">
                {typeof user === "object" ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—" : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">{typeof user === "object" ? user.email ?? "—" : "—"}</Descriptions.Item>
            </Descriptions>
          </div>

          {/* Payment */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700 }}>Thanh toán</h3>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phương thức">
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag
                  color={PAYMENT_STATUS_COLOR[order.paymentStatus] ?? "default"}
                  style={{ borderRadius: 999 }}
                >
                  {paymentStatusLabel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật thanh toán">
                <Select
                  value={order.paymentStatus ?? "pending"}
                  loading={saving}
                  style={{ width: "100%" }}
                  options={PAYMENT_STATUS_OPTIONS}
                  onChange={(v) => handlePaymentStatusChange(String(v))}
                />
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Order info */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700 }}>Thông tin đơn</h3>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Mã đơn">
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                  #{String(order._id).slice(-8).toUpperCase()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">{fmtDate(order.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật">{fmtDate(order.updatedAt)}</Descriptions.Item>
              {order.invoiceNumber && (
                <Descriptions.Item label="Hoá đơn">{order.invoiceNumber}</Descriptions.Item>
              )}
            </Descriptions>
          </div>
        </div>
      </div>
    </div>
  );
}
