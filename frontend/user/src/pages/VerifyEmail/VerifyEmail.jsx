import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";

const BASE = "http://localhost:8000/api/v1";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Không tìm thấy token xác thực.");
      return;
    }

    fetch(`${BASE}/user/verify?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Xác thực email thành công!");
        } else {
          setStatus("error");
          setMessage(data.message || "Xác thực thất bại.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Lỗi kết nối đến server.");
      });
  }, [token]);

  return (
    <>
      <Header />

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2>Đang xác thực email...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: "#28a745" }}>Xác thực thành công!</h2>
            <p style={{ color: "#555", marginTop: 8 }}>{message}</p>
            <button
              onClick={() => navigate("/Login")}
              style={{
                marginTop: 24,
                padding: "12px 32px",
                background: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Đăng nhập ngay
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "#dc3545" }}>Xác thực thất bại</h2>
            <p style={{ color: "#555", marginTop: 8 }}>{message}</p>
            <button
              onClick={() => navigate("/register")}
              style={{
                marginTop: 24,
                padding: "12px 32px",
                background: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Đăng ký lại
            </button>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
