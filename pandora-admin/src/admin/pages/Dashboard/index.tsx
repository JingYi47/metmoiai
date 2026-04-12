import React, { useEffect, useState } from "react";
import { Table, Tag, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { adminOrderApi, adminUsersApi, adminProductApi } from "../../../utils/apiClient";

type Order = any;
type User = any;

const currencyVND = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminOrderApi.getAll(),
      adminUsersApi.getAll(),
      adminProductApi.getAll(),
    ])
      .then(([ordersRes, usersRes, productsRes]) => {
        setOrders(Array.isArray(ordersRes) ? ordersRes : (ordersRes as any)?.checkouts ?? []);
        const usersArr = Array.isArray(usersRes) ? usersRes : (usersRes as any)?.users ?? [];
        setUsers(usersArr);
        const products = Array.isArray(productsRes)
          ? productsRes
          : (productsRes as any)?.products ?? [];
        setProductCount(products.length);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total ?? 0), 0);
  const recentOrders = [...orders]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const topProducts: any[] = [];

  const txnColumns: ColumnsType<any> = [
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, r: any) =>
        r.user?.username ?? r.shippingAddress?.fullName ?? "—",
    },
    {
      title: "Ngày",
      dataIndex: "createdAt",
      key: "date",
      render: (v: string) => v ? new Date(v).toLocaleDateString("vi-VN") : "—",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      render: (v: number) => currencyVND(v ?? 0),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={s === "delivered" ? "green" : s === "pending" ? "orange" : "default"}
          style={{ borderRadius: 999, padding: "2px 10px" }}>
          {s ?? "—"}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid kpi-row" style={{ marginBottom: 18 }}>
        <div className="card kpi-card">
          <div>
            <p className="kpi-title">Tổng doanh thu</p>
            <div className="kpi-value">{currencyVND(totalRevenue)}</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: "#eaf3ff", display: "grid", placeItems: "center" }}>
            $
          </div>
        </div>

        <div className="card kpi-card white">
          <div>
            <p className="kpi-title">Tổng đơn hàng</p>
            <div className="kpi-value">{orders.length.toLocaleString()}</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: "#eaf3ff", display: "grid", placeItems: "center" }}>🛒</div>
        </div>

        <div className="card kpi-card" style={{ background: "#fff7f3" }}>
          <div>
            <p className="kpi-title">Tổng sản phẩm</p>
            <div className="kpi-value">{productCount.toLocaleString()}</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: "#fff7f3", display: "grid", placeItems: "center" }}>📦</div>
        </div>

        <div className="card kpi-card" style={{ background: "#fff7f3" }}>
          <div>
            <p className="kpi-title">Người dùng</p>
            <div className="kpi-value">{users.length.toLocaleString()}</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: "#fff7f3", display: "grid", placeItems: "center" }}>👥</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card table-card">
          <div className="table-head">
            <h3 className="table-title">Đơn hàng gần đây</h3>
          </div>
          <Table
            columns={txnColumns}
            dataSource={recentOrders.map((t: any, i) => ({ ...t, key: t._id ?? i }))}
            pagination={{ pageSize: 5, position: ["bottomCenter"] }}
          />
        </div>

        <div className="card table-card">
          <div className="table-head">
            <h3 className="table-title">Thống kê đơn hàng</h3>
          </div>
          <div style={{ padding: "8px 20px 20px" }}>
            {[
              { key: "pending",    label: "Chờ xử lý",  color: "#f59e0b", bg: "#fff7ed" },
              { key: "processing", label: "Đang xử lý", color: "#3b82f6", bg: "#eff6ff" },
              { key: "shipped",    label: "Đang giao",  color: "#8b5cf6", bg: "#f5f3ff" },
              { key: "delivered",  label: "Đã giao",    color: "#10b981", bg: "#ecfdf5" },
              { key: "cancelled",  label: "Đã huỷ",     color: "#ef4444", bg: "#fef2f2" },
            ].map(({ key, label, color, bg }) => {
              const count = orders.filter((o: any) => o.status === key).length;
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              return (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{pct}%</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, background: bg, color, borderRadius: 999,
                        padding: "2px 10px", minWidth: 28, textAlign: "center"
                      }}>{count}</span>
                    </div>
                  </div>
                  <div style={{ background: "#f3f4f6", borderRadius: 999, height: 8, overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%", borderRadius: 999,
                      background: color, transition: "width .5s ease"
                    }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Tổng đơn hàng</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{orders.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
