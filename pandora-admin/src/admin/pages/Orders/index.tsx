import React, { useMemo, useState, useEffect } from "react";
import { Button, Input, Select, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { adminRealOrderApi } from "../../../utils/apiClient";
import { currencyVND } from "../../mocks/db";

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const month = d.toLocaleString("vi-VN", { month: "short" });
  return `${d.getDate()} ${month}, ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    adminRealOrderApi.getAll()
      .then((data: any) => setOrders(data.orders ?? data ?? []))
      .catch(() => message.error("Không tải được đơn hàng"))
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (filter === "paid") return o.paymentStatus === "paid" || o.paymentStatus === "Paid";
        if (filter === "pending") return o.paymentStatus === "pending" || o.paymentStatus === "Pending";
        return true;
      })
      .filter((o) => {
        if (!q) return true;
        const code = o._id ?? o.code ?? "";
        const user = typeof o.user === "object" ? o.user?.email ?? "" : o.user ?? "";
        return code.includes(q) || user.toLowerCase().includes(q);
      });
  }, [orders, filter, query]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminRealOrderApi.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status } : o));
      message.success("Đã cập nhật trạng thái");
    } catch (err: any) {
      message.error(err.message || "Lỗi cập nhật");
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "_id",
      key: "_id",
      render: (v) => <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{String(v).slice(-8).toUpperCase()}</span>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => fmtDate(v),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, r) => {
        const user = r.user;
        if (typeof user === "object") return user?.email ?? user?.username ?? "—";
        return r.shippingAddress?.fullName ?? "—";
      },
    },
    {
      title: "Trạng thái TT",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (s) => (
        <Tag color={s === "paid" || s === "Paid" ? "green" : "default"} style={{ borderRadius: 999 }}>
          {s ?? "Pending"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s, r) => (
        <Select
          size="small"
          value={s ?? "pending"}
          style={{ width: 130 }}
          onChange={(val) => handleStatusChange(r._id, val)}
          options={[
            { value: "pending", label: "Chờ xử lý" },
            { value: "processing", label: "Đang xử lý" },
            { value: "shipped", label: "Đang giao" },
            { value: "delivered", label: "Đã giao" },
            { value: "cancelled", label: "Đã huỷ" },
          ]}
        />
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (v: number) => currencyVND(v),
    },
    {
      title: "",
      key: "view",
      width: 60,
      render: (_: any, r: any) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/orders/${r._id}`)}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Đơn hàng</h1></div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <Select
            value={filter} onChange={setFilter} style={{ width: 180 }}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "paid", label: "Đã thanh toán" },
              { value: "pending", label: "Chờ thanh toán" },
            ]}
          />
          <Input
            prefix={<span style={{ opacity: 0.6 }}>🔍</span>}
            placeholder="Tìm theo mã đơn, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 12, position: ["bottomCenter"] }}
        />
        <div style={{ textAlign: "right", color: "#6b7280", marginTop: 8 }}>{data.length} kết quả</div>
      </div>
    </div>
  );
}
