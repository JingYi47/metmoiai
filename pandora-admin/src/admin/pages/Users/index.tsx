import React, { useEffect, useState } from "react";
import { Button, Input, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { adminUsersApi } from "../../../utils/apiClient";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = () => {
    setLoading(true);
    adminUsersApi.getAll()
      .then((data: any) => setUsers(data.users ?? data ?? []))
      .catch(() => message.error("Không tải được danh sách người dùng"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminUsersApi.delete(id);
      message.success("Đã xoá người dùng");
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err: any) {
      message.error(err.message || "Lỗi xoá người dùng");
    }
  };

  const handleLock = async (id: string, isLocked: boolean) => {
    try {
      if (isLocked) {
        await adminUsersApi.unlock(id);
        message.success("Đã mở khoá tài khoản");
      } else {
        await adminUsersApi.lock(id);
        message.success("Đã khoá tài khoản");
      }
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isLocked: !isLocked } : u));
    } catch (err: any) {
      message.error(err.message || "Lỗi");
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await adminUsersApi.updateRole(id, role);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
      message.success("Đã cập nhật vai trò");
    } catch (err: any) {
      message.error(err.message || "Lỗi");
    }
  };

  const filtered = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    { title: "Tên", dataIndex: "username", key: "username", render: (v: string) => v ?? "—" },
    {
      title: "Vai trò",
      key: "role",
      render: (_: any, r: any) => (
        <Select
          value={r.role}
          size="small"
          style={{ width: 110 }}
          onChange={(val) => handleRoleChange(r._id, val)}
          options={[
            { value: "user", label: "User" },
            { value: "staff", label: "Staff" },
            { value: "admin", label: "Admin" },
          ]}
        />
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, r: any) => (
        <Tag color={r.isLocked ? "red" : "green"} style={{ borderRadius: 999 }}>
          {r.isLocked ? "Bị khoá" : "Hoạt động"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, r: any) => (
        <Space>
          <Button
            icon={r.isLocked ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleLock(r._id, r.isLocked)}
            size="small"
          >
            {r.isLocked ? "Mở khoá" : "Khoá"}
          </Button>
          <Popconfirm title="Xoá người dùng này?" onConfirm={() => handleDelete(r._id)}>
            <Button danger size="small">Xoá</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Khách hàng</h1>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <Input
          prefix={<span style={{ opacity: 0.6 }}>🔍</span>}
          placeholder="Tìm theo email, tên..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 360, marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </div>
    </div>
  );
}
