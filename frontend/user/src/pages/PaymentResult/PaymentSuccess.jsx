import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import { orderApi } from "../../services/api";
import "./PaymentResult.css";

export default function PaymentSuccess() {
  const { checkoutId } = useParams();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!checkoutId) { setDone(true); return; }
    // Tạo order từ checkout sau khi thanh toán thành công
    orderApi.createFromCheckout(checkoutId)
      .catch(() => {})
      .finally(() => setDone(true));
  }, [checkoutId]);

  return (
    <>
      <Header />
      <div className="pr-page">
        <div className="pr-card success">
          <div className="pr-icon">✅</div>
          <h2>Thanh toán thành công!</h2>
          <p>Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ xử lý và giao hàng sớm nhất.</p>
          <div className="pr-actions">
            <button className="pr-btn primary" onClick={() => navigate("/Order")}>
              Xem đơn hàng
            </button>
            <button className="pr-btn secondary" onClick={() => navigate("/")}>
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
