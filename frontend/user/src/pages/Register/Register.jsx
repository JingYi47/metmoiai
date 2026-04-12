import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Register.css";
import logologin from "../../assets/logologin.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(email, password, firstName, lastName);
      alert("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
      navigate("/Login");
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-container">

        <div className="register-left">
          <h1>
            Welcome to <br /> PandoraPro!!
          </h1>
          <img src={logologin} alt="logo" className="logo-left" />
        </div>

        <div className="register-right">
          <h2>Đăng ký</h2>

          {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}

          <input
            className="input-field"
            type="text"
            placeholder="Họ (First Name)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            className="input-field"
            type="text"
            placeholder="Tên (Last Name)"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            className="input-field"
            type="text"
            placeholder="Nhập địa chỉ Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <div className="password-field">
            <input
              className="input-field"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="password-field">
            <input
              className="input-field"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            <p className="login-text">
              Đã có tài khoản? <a href="/Login">Đăng nhập</a>
            </p>
          </div>

          <button className="register-btn" onClick={handleRegister} disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </div>

      </div>
    </div>
  );
}
