import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";

import { checkoutApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import ShippingAddress from "../../components/ShippingAddress";
import OrderSummary from "../../components/OrderSummary";
import PaymentMethod from "../../components/PaymentMethod";
import CheckoutActions from "../../components/CheckoutActions";

import "./checkOrder.css";

export default function OrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const cartData = location.state ?? {};
  const {
    items = [],
    subtotal = 0,
    shippingFee = 0,
    discount = 0,
    total = 0,
  } = cartData;

  const [paymentMethod, setPaymentMethod] = useState(
    cartData.paymentMethod ?? "COD"
  );
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.username ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const orderCode = "DH" + Date.now();

  const handleOrder = async () => {
    if (!shippingAddress.address || !shippingAddress.phone) {
      setError("Vui lòng điền đầy đủ địa chỉ và số điện thoại");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await checkoutApi.create({
        items,
        shippingAddress,
        paymentMethod,
        subtotal,
        shippingFee,
        discount,
        total,
      });
      navigate("/Order");
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
            <h2>Thông tin thanh toán</h2>

            <div className="checkout-header">
              <span className="order-code">
                Mã đơn hàng: <strong>{orderCode}</strong>
              </span>
            </div>

            {/* Địa chỉ */}
            <ShippingAddress
              shippingAddress={shippingAddress}
              onChange={setShippingAddress}
              editable
            />

            {/* Tóm tắt đơn */}
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shippingFee={shippingFee}
              discount={discount}
              total={total}
            />
          </div>

          {/* RIGHT */}
          <div className="checkout-right">
            <PaymentMethod
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />

            {error && <p style={{ color: "red" }}>{error}</p>}

            <CheckoutActions
              navigate={navigate}
              handleOrder={handleOrder}
              loading={loading}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
