import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import ShippingAddress from "../../components/ShippingAddress";
import OrderSummary from "../../components/OrderSummary";
import PaymentMethod from "../../components/PaymentMethod";
import { checkoutApi, orderApi, paymentApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./checkout.css";

export default function OrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Dữ liệu truyền từ CartPage
  const cartData = location.state ?? {};
  const { items = [], subtotal = 0, shippingFee = 0, discount = 0, total = 0, couponCode = "" } = cartData;

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "",
    phone: user?.phoneNo ?? user?.phone ?? "",
    address: user?.address ?? "",
    province: user?.city ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orderCode] = useState(() => "DH" + Date.now());

  const handlePlaceOrder = async () => {
    if (!shippingAddress.address || !shippingAddress.phone) {
      setError("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // 1. Tạo checkout
      const res = await checkoutApi.create({
        items,
        shippingAddress,
        paymentMethod,
        subtotal,
        shippingFee,
        discount,
        total,
        couponCode: couponCode || undefined,
      });
      const checkoutId = res.checkout?._id;

      // 2. Xử lý thanh toán theo phương thức
      if (paymentMethod === "COD") {
        await orderApi.createFromCheckout(checkoutId);
        navigate("/Order");
      } else if (paymentMethod === "VNPAY") {
        const vnRes = await paymentApi.createVnpay(checkoutId);
        window.location.href = vnRes.paymentUrl;
      } else if (paymentMethod === "MOMO") {
        const momoRes = await paymentApi.createMomo(checkoutId);
        window.location.href = momoRes.payUrl;
      } else {
        navigate("/Order");
      }
    } catch (err) {
      setError(err.message || "Lỗi đặt hàng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="checkout-page">
        <div className="checkout-container">
          {/* LEFT */}
          <div className="checkout-left">
            <h2>Thông tin đơn hàng</h2>
            <div className="order-code-badge">
              📝 Mã đơn hàng: <strong>{orderCode}</strong>
            </div>

            {/* Địa chỉ */}
            <div className="co-card">
              <div className="co-card-title">📍 Địa chỉ nhận hàng</div>
              <ShippingAddress
                shippingAddress={shippingAddress}
                onChange={setShippingAddress}
                editable
              />
            </div>

            {/* Tóm tắt đơn */}
            <div className="co-card">
              <div className="co-card-title">🛒 Sản phẩm đã chọn</div>
              <OrderSummary
                items={items}
                subtotal={subtotal}
                shippingFee={shippingFee}
                discount={discount}
                total={total}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="checkout-right">
            <div className="co-card">
              <div className="co-card-title">💳 Phương thức thanh toán</div>
              <PaymentMethod
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 8 }}>{error}</p>}

            <div className="checkout-actions">
              <button className="btn-back" onClick={() => navigate(-1)}>&#8592; Quay lại</button>
              <button
                className="btn-order"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đặt hàng"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
