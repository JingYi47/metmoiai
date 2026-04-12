import "./Login.css";
import logologin from "../../assets/logologin.jpg";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle(credentialResponse?.credential);
      navigate("/");
    } catch (err) {
      setError(err.message || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Không thể đăng nhập bằng Google");
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* LEFT */}
        <div className="login-left">
          <h1>
            Welcome to <br /> PandoraPro!!
          </h1>
          <img src={logologin} alt="logo" className="logo-left" />
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <h2>Đăng nhập</h2>

          {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}

          <input
            type="text"
            placeholder="Nhập địa chỉ Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="register-text">
            Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
          </p>

          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="login-divider">hoặc</div>
          <div className="google-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              shape="pill"
              width="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
