import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import "./PaymentResult.css";

export default function PaymentFail() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="pr-page">
        <div className="pr-card fail">
          <div className="pr-icon">❌</div>
          <h2>Thanh toán thất bại</h2>
          <p>Giao dịch không thành công hoặc đã bị huỷ. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
          <div className="pr-actions">
            <button className="pr-btn primary" onClick={() => navigate(-1)}>
              Thử lại
            </button>
            <button className="pr-btn secondary" onClick={() => navigate("/")}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
