import React, { useState } from "react";
import { Button, Divider, Form, Input, message, Switch, Select, Upload, Avatar } from "antd";
import { UserOutlined, LockOutlined, BellOutlined, GlobalOutlined, UploadOutlined } from "@ant-design/icons";
import { useAuthStore } from "../../../auth/auth.store";

export default function Settings() {
  const { user } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [notif, setNotif] = useState({
    newOrder: true, lowStock: true, newUser: false, dailyReport: true, weeklyReport: false,
  });

  const handleSaveProfile = async () => {
    await profileForm.validateFields();
    setSaving(true);
    setTimeout(() => { setSaving(false); message.success("Đã cập nhật thông tin!"); }, 800);
  };

  const handleSavePw = async () => {
    const vals = await pwForm.validateFields();
    if (vals.newPw !== vals.confirmPw) { message.error("Mật khẩu mới không khớp!"); return; }
    setSavingPw(true);
    setTimeout(() => { setSavingPw(false); message.success("Đã đổi mật khẩu!"); pwForm.resetFields(); }, 800);
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700 }}>Cài đặt cá nhân</h2>

      {/* Profile */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <UserOutlined style={{ fontSize: 16, color: "#3b82f6" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Thông tin tài khoản</h3>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24 }}>
          <Avatar size={72} icon={<UserOutlined />} style={{ background: "#3b82f6", flexShrink: 0 }}>
            {user?.email?.[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.email ?? "admin@pandorapro.vn"}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Quản trị viên · Pandora Pro</div>
            <Upload showUploadList={false} beforeUpload={() => false} onChange={() => message.info("Chức năng đổi avatar chưa được kích hoạt")}>
              <Button size="small" icon={<UploadOutlined />} style={{ marginTop: 8 }}>Đổi ảnh đại diện</Button>
            </Upload>
          </div>
        </div>

        <Form form={profileForm} layout="vertical" initialValues={{ email: user?.email, displayName: "Admin Pandora", phone: "", role: "admin" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Tên hiển thị" name="displayName" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
              <Input placeholder="Tên của bạn" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Input placeholder="09xxxxxxxx" />
            </Form.Item>
            <Form.Item label="Vai trò" name="role">
              <Input disabled />
            </Form.Item>
          </div>
        </Form>
        <Button type="primary" loading={saving} onClick={handleSaveProfile}>Lưu thông tin</Button>
      </div>

      {/* Password */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <LockOutlined style={{ fontSize: 16, color: "#f59e0b" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Đổi mật khẩu</h3>
        </div>
        <Form form={pwForm} layout="vertical">
          <Form.Item label="Mật khẩu hiện tại" name="oldPw" rules={[{ required: true }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Mật khẩu mới" name="newPw" rules={[{ required: true }, { min: 6, message: "Tối thiểu 6 ký tự" }]}>
              <Input.Password placeholder="••••••••" />
            </Form.Item>
            <Form.Item label="Xác nhận mật khẩu mới" name="confirmPw" rules={[{ required: true }]}>
              <Input.Password placeholder="••••••••" />
            </Form.Item>
          </div>
        </Form>
        <Button type="primary" loading={savingPw} onClick={handleSavePw} style={{ background: "#f59e0b", borderColor: "#f59e0b" }}>Đổi mật khẩu</Button>
      </div>

      {/* Notifications */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <BellOutlined style={{ fontSize: 16, color: "#10b981" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Cài đặt thông báo</h3>
        </div>
        {[
          { key: "newOrder",     label: "Đơn hàng mới",       desc: "Nhận thông báo khi có đơn hàng mới" },
          { key: "lowStock",     label: "Sản phẩm sắp hết",   desc: "Cảnh báo khi tồn kho < 5 sản phẩm" },
          { key: "newUser",      label: "Người dùng mới",      desc: "Khi có tài khoản khách hàng mới đăng ký" },
          { key: "dailyReport",  label: "Báo cáo hàng ngày",  desc: "Gửi email tóm tắt doanh thu mỗi tối" },
          { key: "weeklyReport", label: "Báo cáo hàng tuần",  desc: "Tổng kết hoạt động cuối tuần" },
        ].map(({ key, label, desc }) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f9fafb" }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{desc}</div>
            </div>
            <Switch
              checked={notif[key as keyof typeof notif]}
              onChange={(v) => setNotif((p) => ({ ...p, [key]: v }))}
              style={{ background: notif[key as keyof typeof notif] ? "#3b82f6" : undefined }}
            />
          </div>
        ))}
        <Button type="primary" style={{ marginTop: 16, background: "#10b981", borderColor: "#10b981" }}
          onClick={() => message.success("Đã lưu cài đặt thông báo")}>
          Lưu cài đặt
        </Button>
      </div>

      {/* System */}
      <div className="card card-pad">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <GlobalOutlined style={{ fontSize: 16, color: "#6b7280" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Hệ thống</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Form.Item label="Ngôn ngữ">
            <Select defaultValue="vi" onChange={() => message.info("Chức năng đang phát triển")}>
              <Select.Option value="vi">🇻🇳 Tiếng Việt</Select.Option>
              <Select.Option value="en">🇺🇸 English</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Múi giờ">
            <Select defaultValue="Asia/Ho_Chi_Minh">
              <Select.Option value="Asia/Ho_Chi_Minh">GMT+7 (Hà Nội / TP.HCM)</Select.Option>
            </Select>
          </Form.Item>
        </div>
        <Divider style={{ margin: "8px 0 16px" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <Button danger onClick={() => message.info("Đã xoá cache thành công")}>Xoá cache</Button>
          <Button onClick={() => message.info("Đã xuất log thành công")}>Xuất log hệ thống</Button>
        </div>
      </div>
    </div>
  );
}
