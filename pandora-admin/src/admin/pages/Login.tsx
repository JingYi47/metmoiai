import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/auth.store";
import { getToken } from "../../utils/storage";
import { adminAuthApi } from "../../utils/apiClient";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (t && user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const onFinish = async (v: any) => {
    setError("");
    setLoading(true);
    try {
      const data = await adminAuthApi.login(v.email, v.password);
      const { token, user: u } = data;
      // Chỉ cho phép admin hoặc staff đăng nhập
      if (u.role !== "admin" && u.role !== "staff") {
        setError("Tài khoản này không có quyền truy cập admin");
        return;
      }
      setAuth(token, u);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--page-bg)" }}>
      <Card style={{ width: 380, borderRadius: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>PandoraPro Admin</h1>
        <p style={{ color: "#6b7280", marginTop: 6 }}>Đăng nhập vào bảng điều khiển</p>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} initialValues={{ email: "", password: "" }}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: "Nhập email" }]}>
            <Input placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}
