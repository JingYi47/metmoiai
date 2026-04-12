import React, { useEffect, useState } from "react";
import { Spin, Table, Tag } from "antd";
import { adminOrderApi, adminUsersApi, adminProductApi } from "../../../utils/apiClient";

const vnd = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

function buildMonthly(orders: any[]) {
  const map: Record<string, { revenue: number; count: number }> = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    if (isNaN(d.getTime())) return;
    const key = `T${d.getMonth() + 1}/${d.getFullYear()}`;
    if (!map[key]) map[key] = { revenue: 0, count: 0 };
    map[key].revenue += o.total ?? 0;
    map[key].count += 1;
  });
  return Object.entries(map)
    .slice(-6)
    .map(([month, v]) => ({ month, ...v }));
}

const STATUS_INFO: Record<string, { label: string; color: string; tagColor: string; bg: string }> = {
  pending:    { label: "Chờ xử lý",  color: "#f59e0b", tagColor: "orange",  bg: "#fff7ed" },
  confirmed:  { label: "Đã xác nhận",color: "#3b82f6", tagColor: "blue",    bg: "#eff6ff" },
  processing: { label: "Đang xử lý", color: "#8b5cf6", tagColor: "purple",  bg: "#f5f3ff" },
  shipped:    { label: "Đang giao",  color: "#06b6d4", tagColor: "cyan",    bg: "#ecfeff" },
  delivered:  { label: "Đã giao",   color: "#10b981", tagColor: "green",   bg: "#ecfdf5" },
  cancelled:  { label: "Đã huỷ",    color: "#ef4444", tagColor: "red",     bg: "#fef2f2" },
};

export default function Reports() {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminOrderApi.getAll(), adminUsersApi.getAll(), adminProductApi.getAll()])
      .then(([o, u, p]) => {
        setOrders(Array.isArray(o) ? o : (o as any)?.checkouts ?? []);
        setUsers(Array.isArray(u) ? u : (u as any)?.users ?? []);
        const prods = Array.isArray(p) ? p : (p as any)?.products ?? [];
        setProductCount(prods.length);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const completedOrders = orders.filter((o) => o.status === "delivered" || o.status === "completed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");
  const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;

  const monthly = buildMonthly(orders);
  const maxRev = Math.max(...monthly.map((m) => m.revenue), 1);

  // Top products by order count
  const productFreq: Record<string, { name: string; count: number }> = {};
  orders.forEach((o) => {
    (o.items ?? []).forEach((item: any) => {
      const key = item.product?._id ?? item.product ?? item.name ?? "?";
      const name = item.name ?? item.product?.name ?? "—";
      if (!productFreq[key]) productFreq[key] = { name, count: 0 };
      productFreq[key].count += item.quantity ?? 1;
    });
  });
  const topProducts = Object.values(productFreq)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentColumns = [
    {
      title: "Khách hàng",
      key: "cust",
      render: (_: any, r: any) => r.user?.username ?? r.shippingAddress?.fullName ?? "—",
    },
    {
      title: "Giá trị",
      dataIndex: "total",
      render: (v: number) => <strong>{vnd(v ?? 0)}</strong>,
    },
    {
      title: "Ngày",
      dataIndex: "createdAt",
      render: (v: string) => v ? new Date(v).toLocaleDateString("vi-VN") : "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s: string) => {
        const info = STATUS_INFO[s] ?? { label: s, tagColor: "default" };
        return <Tag color={info.tagColor} style={{ borderRadius: 999 }}>{info.label}</Tag>;
      },
    },
  ];

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Báo cáo & Thống kê</h2>

      {/* KPI row */}
      <div className="grid kpi-row" style={{ marginBottom: 20 }}>
        {[
          { title: "Tổng doanh thu", value: vnd(totalRevenue), icon: "💰", bg: "#eaf3ff" },
          { title: "Tổng đơn hàng",  value: orders.length,      icon: "🛒", bg: "#f0fdf4" },
          { title: "Đơn hoàn thành", value: completedOrders.length, icon: "✅", bg: "#f0fdf4" },
          { title: "Đơn đã huỷ",    value: cancelledOrders.length, icon: "❌", bg: "#fef2f2" },
          { title: "Sản phẩm",       value: productCount,        icon: "📦", bg: "#fff7f3" },
          { title: "Người dùng",     value: users.length,        icon: "👥", bg: "#fdf4ff" },
          { title: "Giá trị TB/đơn", value: vnd(avgOrder),       icon: "📈", bg: "#fffbeb" },
          { title: "Tỷ lệ hoàn thành", value: orders.length ? `${Math.round((completedOrders.length / orders.length) * 100)}%` : "—", icon: "🎯", bg: "#ecfdf5" },
        ].map((kpi) => (
          <div className="card kpi-card" key={kpi.title} style={{ background: kpi.bg }}>
            <div>
              <p className="kpi-title">{kpi.title}</p>
              <div className="kpi-value">{kpi.value}</div>
            </div>
            <div style={{ fontSize: 24 }}>{kpi.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Monthly bar chart */}
        <div className="card card-pad">
          <h3 className="table-title" style={{ marginBottom: 20 }}>Doanh thu theo tháng</h3>
          {monthly.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Chưa có dữ liệu</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, paddingBottom: 8 }}>
              {monthly.map((m) => (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>
                    {(m.revenue / 1_000_000).toFixed(1)}M
                  </span>
                  <div style={{
                    width: "100%", borderRadius: "6px 6px 0 0",
                    height: `${Math.round((m.revenue / maxRev) * 120)}px`,
                    background: "linear-gradient(to top, #3b82f6, #60a5fa)",
                    minHeight: 4,
                  }} />
                  <span style={{ fontSize: 10, color: "#6b7280", textAlign: "center" }}>{m.month}</span>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>{m.count} đơn</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="card card-pad">
          <h3 className="table-title" style={{ marginBottom: 16 }}>Phân bổ trạng thái đơn hàng</h3>
          {Object.entries(STATUS_INFO).map(([key, info]) => {
            const count = orders.filter((o) => o.status === key).length;
            const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: info.color, display: "inline-block" }} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{info.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{pct}%</span>
                    <span style={{ fontSize: 12, fontWeight: 700, background: info.bg, color: info.color, borderRadius: 999, padding: "1px 10px" }}>{count}</span>
                  </div>
                </div>
                <div style={{ background: "#f3f4f6", borderRadius: 999, height: 7, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: info.color, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 18 }}>
        {/* Recent orders */}
        <div className="card table-card">
          <div className="table-head"><h3 className="table-title">Đơn hàng gần đây</h3></div>
          <Table
            columns={recentColumns}
            dataSource={[...orders]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 8)
              .map((o, i) => ({ ...o, key: o._id ?? i }))}
            pagination={false}
            size="small"
          />
        </div>

        {/* Top products */}
        <div className="card card-pad">
          <h3 className="table-title" style={{ marginBottom: 16 }}>Sản phẩm bán chạy</h3>
          {topProducts.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center" }}>Không có dữ liệu</p>
          ) : (
            topProducts.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 999, background: i === 0 ? "#fbbf24" : i === 1 ? "#d1d5db" : "#f9fafb",
                  fontWeight: 800, fontSize: 12, display: "grid", placeItems: "center", flexShrink: 0, color: i < 2 ? "#1f2937" : "#6b7280"
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                </div>
                <Tag color="blue" style={{ borderRadius: 999 }}>{p.count} bán</Tag>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
