import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import "./payment.css";

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("cod");

  if (!state) {
    return <p>Không có dữ liệu thanh toán</p>;
  }

  const { items, subtotal, discount, total } = state;

  const handleOrder = () => {
    const orderData = {
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
    };
    navigate("/checkorder", { state: orderData });
  };

  return (
    <>
      <Header />

      <main className="checkout-page">
        <div className="checkout-container">
          {/* LEFT */}
          <div className="checkout-left">
            <h2>Thông tin thanh toán</h2>

            <input placeholder="Tên" />
            <input placeholder="Tên công ty (không bắt buộc)" />
            <input placeholder="Địa chỉ (bắt buộc)" />
            <input placeholder="Căn hộ, tầng (không bắt buộc)" />
            <input placeholder="Thành phố / Quận / Huyện" />
            <input placeholder="Số điện thoại" />
            <input placeholder="Email" />

            <label className="save-info">
              <input type="checkbox" defaultChecked />
              Lưu thông tin này để thanh toán nhanh hơn vào lần sau
            </label>
          </div>

          {/* RIGHT */}
          <div className="checkout-right">
            {items.map((item, index) => (
              <div className="checkout-item" key={index}>
                <img src={item.image} alt={item.name} />
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{item.total.toLocaleString()}đ</span>
              </div>
            ))}

            <hr />

            <div className="checkout-row">
              <span>Tổng tiền hàng</span>
              <span>{subtotal.toLocaleString()}đ</span>
            </div>

            <div className="checkout-row">
              <span>Phí vận chuyển</span>
              <span>Free</span>
            </div>

            <div className="checkout-row">
              <span>Khuyến mãi</span>
              <span>-{discount.toLocaleString()}đ</span>
            </div>

            <hr />

            {/* PAYMENT */}
            <div className="payment-method">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Bank
              </label>

              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Thanh toán khi nhận hàng
              </label>
            </div>

            <hr />

            <div className="checkout-row total">
              <span>Total</span>
              <span>{total.toLocaleString()}đ</span>
            </div>

            {/* ACTIONS */}
            <div className="checkout-actions">
              <button className="checkout-back" onClick={() => navigate(-1)}>
                Quay lại
              </button>

              <button className="checkout-submit" onClick={handleOrder}>
                Đặt hàng
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
