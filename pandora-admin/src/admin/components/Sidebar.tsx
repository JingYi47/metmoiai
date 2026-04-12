import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  GiftOutlined,
  InboxOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { BrandLogo } from "./BrandLogo";

type Item = {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const items: Item[] = [
  { to: "/", label: "Dashboard", icon: <HomeOutlined className="nav-icon" /> },
  { to: "/orders", label: "Đơn hàng", icon: <ShoppingCartOutlined className="nav-icon" />, badge: "16" },
  { to: "/products", label: "Sản phẩm", icon: <TagsOutlined className="nav-icon" /> },
  { to: "/categories", label: "Danh mục thể loại", icon: <AppstoreOutlined className="nav-icon" /> },
  { to: "/users", label: "Khách hàng", icon: <TeamOutlined className="nav-icon" /> },
  { to: "/reports", label: "Báo cáo", icon: <BarChartOutlined className="nav-icon" /> },
  { to: "/coupons", label: "Khuyến mãi", icon: <GiftOutlined className="nav-icon" /> },
  { to: "/inbox", label: "Inbox", icon: <InboxOutlined className="nav-icon" /> },
  { to: "/support", label: "Hỗ trợ", icon: <QuestionCircleOutlined className="nav-icon" /> },
  { to: "/reviews", label: "Đánh giá", icon: <StarOutlined className="nav-icon" /> },
  { to: "/settings", label: "Cài đặt cá nhân", icon: <SettingOutlined className="nav-icon" /> },
];

export function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <BrandLogo />

      <nav className="nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            end={it.to === "/"}
          >
            {it.icon}
            <span>{it.label}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <div className="promo">
        <h4>Phát triển kinh doanh</h4>
        <p>Explore our marketing solutions</p>
        <Button size="middle" style={{ borderRadius: 10 }}>
          Xem thêm
        </Button>
      </div>

      <div style={{ height: 10 }} />
    </aside>
  );
}
