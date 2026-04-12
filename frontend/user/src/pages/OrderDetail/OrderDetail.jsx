import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import { orderApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./OrderDetail.css";

const STATUS_LABEL = {
  pending:    "Chờ xác nhận",
  confirmed:  "Đã xác nhận",
  processing: "Đang xử lý",
  shipped:    "Đang giao",
  delivered:  "Đã giao",
  completed:  "Hoàn thành",
  cancelled:  "Đã hủy",
  returned:   "Đã trả hàng",
};

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];

const PAYMENT_LABEL = {
  COD: "Thanh toán khi nhận hàng (COD)",
  BANKING: "Chuyển khoản ngân hàng",
  MOMO: "Ví MoMo",
  VNPAY: "VNPay",
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    orderApi.getById(id)
      .then((data) => setOrder(data.order ?? data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (!user) return (
    <><Header /><div className="od-empty">Vui lòng <a href="/Login">đăng nhập</a></div><Footer /></>
  );
  if (loading) return (
    <><Header /><div className="od-empty">Đang tải...</div><Footer /></>
  );
  if (!order) return (
    <><Header /><div className="od-empty">Không tìm thấy đơn hàng</div><Footer /></>
  );

  const isCancelled = order.status === "cancelled" || order.status === "returned";
  const currentStep = isCancelled ? -1 : Math.max(STATUS_STEPS.indexOf(order.status), 0);
  const fmt = (n) => (n ?? 0).toLocaleString("vi-VN") + "đ";
  const fmtDate = (d) => d ? new Date(d).toLocaleString("vi-VN") : "—";
  const cannotCancelStatus = ["shipped", "delivered", "completed"];
  const canCancel =
    !isCancelled &&
    order.paymentStatus !== "paid" &&
    !cannotCancelStatus.includes(order.status);

  const handleCancelOrder = async () => {
    if (!order?._id) return;
    if (!canCancel) return;
    const ok = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?");
    if (!ok) return;

    try {
      setCancelling(true);
      const res = await orderApi.cancel(order._id);
      const next = res.order ?? res;
      setOrder(next);
    } catch (err) {
      alert(err?.message || "Hủy đơn thất bại");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Header />

      <div className="od-page">

        {/* Breadcrumb */}
        <nav className="od-breadcrumb">
          <span onClick={() => navigate("/")}>Trang chủ</span>
          <span className="sep">›</span>
          <span onClick={() => navigate("/Order")}>Đơn hàng</span>
          <span className="sep">›</span>
          <span className="current">Chi tiết đơn</span>
        </nav>

        <div className="od-header-row">
          <h2>Chi tiết đơn hàng</h2>
          <span className={`od-status-badge ${order.status}`}>{STATUS_LABEL[order.status] ?? order.status}</span>
        </div>

        <div className="od-meta">
          <span>Mã đơn: <strong>#{order._id.slice(-8).toUpperCase()}</strong></span>
          <span>Ngày đặt: <strong>{fmtDate(order.createdAt)}</strong></span>
        </div>

        {/* Progress bar */}
        {!isCancelled && (
          <div className="od-progress">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={`od-step ${i <= currentStep ? "done" : ""} ${i === currentStep ? "active" : ""}`}>
                <div className="od-step-circle">{i < currentStep ? "✓" : i + 1}</div>
                <span>{STATUS_LABEL[step]}</span>
                {i < STATUS_STEPS.length - 1 && <div className={`od-step-line ${i < currentStep ? "done" : ""}`} />}
              </div>
            ))}
          </div>
        )}

        {isCancelled && (
          <div className="od-cancelled-banner">Đơn hàng đã bị hủy</div>
        )}

        <div className="od-layout">
          {/* LEFT */}
          <div className="od-left">

            {/* Products */}
            <div className="od-card">
              <h4 className="od-card-title">Sản phẩm đã đặt</h4>
              {order.items.map((item, i) => {
                const product = item.product ?? {};
                const imgUrl = product.images?.[0]?.url ?? product.imageUrl ?? "";
                return (
                  <div className="od-item" key={i}>
                    <div className="od-item-img">
                      {imgUrl
                        ? <img src={imgUrl} alt={item.name} />
                        : <div className="od-img-placeholder">{item.name?.[0]}</div>
                      }
                    </div>
                    <div className="od-item-info">
                      <p className="od-item-name">{item.name}</p>
                      {item.color && <p className="od-item-meta">Màu: {item.color}</p>}
                      <p className="od-item-meta">x{item.quantity} × {fmt(item.price)}</p>
                    </div>
                    <div className="od-item-total">{fmt(item.total ?? (item.price * item.quantity))}</div>
                  </div>
                );
              })}
            </div>

            {/* Shipping address */}
            <div className="od-card">
              <h4 className="od-card-title">Địa chỉ giao hàng</h4>
              <div className="od-address">
                <p><strong>{order.shippingAddress?.fullName}</strong></p>
                <p>📞 {order.shippingAddress?.phone}</p>
                <p>📍 {[order.shippingAddress?.address, order.shippingAddress?.ward, order.shippingAddress?.district, order.shippingAddress?.province].filter(Boolean).join(", ")}</p>
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <div className="od-right">

            {/* Order summary */}
            <div className="od-card">
              <h4 className="od-card-title">Tổng kết đơn hàng</h4>
              <div className="od-summary-row"><span>Tổng tiền hàng</span><span>{fmt(order.subtotal)}</span></div>
              <div className="od-summary-row"><span>Phí vận chuyển</span><span>{order.shippingFee === 0 ? "Free" : fmt(order.shippingFee)}</span></div>
              {order.discount > 0 && (
                <div className="od-summary-row discount"><span>Khuyến mãi</span><span>-{fmt(order.discount)}</span></div>
              )}
              <div className="od-summary-divider" />
              <div className="od-summary-row total"><span>Tổng thanh toán</span><span>{fmt(order.total)}</span></div>
            </div>

            {/* Payment */}
            <div className="od-card">
              <h4 className="od-card-title">Thanh toán</h4>
              <p className="od-payment-method">{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
              <p className="od-payment-status">
                Trạng thái: <span className={`od-pay-badge ${order.paymentStatus ?? "pending"}`}>
                  {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </p>
            </div>

            {canCancel && (
              <button
                className="od-back-btn"
                onClick={handleCancelOrder}
                disabled={cancelling}
                style={{ background: "#b91c1c", marginBottom: 12 }}
              >
                {cancelling ? "Đang hủy..." : "Hủy đơn"}
              </button>
            )}

            <button className="od-back-btn" onClick={() => navigate("/Order")}>
              ← Quay lại danh sách đơn hàng
            </button>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
