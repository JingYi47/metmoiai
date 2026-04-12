import "../styles/footer.css";
import qr from "../assets/qr.png";
import googlePlay from "../assets/google-play.png";
import appStore from "../assets/app-store.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">

              {/* Newsletter */}
        <div className="footer-col">
          <h4>Đăng kí nhận bản tin</h4>
          <p>Nhận ngay giảm giá 10% cho đơn hàng đầu tiên</p>

          <div className="newsletter">
            <input type="email" placeholder="Enter your email" />
            <button>➤</button>
          </div>
        </div>

        {/* Support */}
        <div className="footer-col">
          <h4>Hỗ trợ</h4>
          <p>123, Cộng Hòa, Tân Bình, HCM</p>
          <p>pandacorp@gmail.com</p>
          <p>+8412345678</p>
        </div>

        {/* Account */}
        <div className="footer-col">
          <h4>Tài khoản</h4>
          <ul>
            <li>Tài khoản của tôi</li>
            <li>Đăng kí / Đăng nhập</li>
            <li>Giỏ hàng</li>
            <li>Danh sách yêu thích</li>
            <li>Cửa hàng</li>
          </ul>
        </div>

        {/* Quick links */}
        <div className="footer-col">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li>Chính sách bảo mật</li>
            <li>Điều khoản sử dụng</li>
            <li>Câu hỏi thường gặp</li>
            <li>Liên hệ</li>
          </ul>
        </div>

        {/* App */}
        <div className="footer-col">
          <h4>Tải Ứng Dụng</h4>
          <p>Lưu 10% với App</p>

          <div className="app-box">
            <img src={qr} alt="QR code" className="qr-img" />

            <div className="store-btns">
              <img src={googlePlay} alt="Google Play" />
              <img src={appStore} alt="App Store" />
            </div>
          </div>

          <div className="socials">
            <span>f</span>
            <span>X</span>
            <span>📷</span>
            <span>in</span>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        © Copyright Rimel 2025. All right reserved
      </div>
    </footer>
  );
}
