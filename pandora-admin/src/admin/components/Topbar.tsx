import React from "react";
import { Badge, Dropdown, Input, MenuProps, Space } from "antd";
import { BellOutlined, MessageOutlined, SearchOutlined, DownOutlined } from "@ant-design/icons";
import { useAuthStore } from "../../auth/auth.store";

export function Topbar() {
  const logout = useAuthStore((s) => s.logout);

  const menu: MenuProps = {
    items: [
      { key: "profile", label: "Profile" },
      { key: "logout", label: "Logout" },
    ],
    onClick: (info) => {
      if (info.key === "logout") logout();
    },
  };

  return (
    <header className="admin-topbar">
      <div style={{ maxWidth: 560, width: "55%" }}>
        <Input
          allowClear
          placeholder="Tìm kiếm"
          prefix={<SearchOutlined />}
          size="large"
          style={{ borderRadius: 12, background: "rgba(255,255,255,.65)" }}
        />
      </div>

      <Space size={18} align="center">
        <MessageOutlined style={{ fontSize: 20 }} />
        <Badge count={5} size="small" offset={[-3, 3]}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>

        <Dropdown menu={menu} trigger={["click"]}>
          <a onClick={(e) => e.preventDefault()} style={{ color: "inherit" }}>
            <Space>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "#22c55e",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                }}
              >
                Hi
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                <span style={{ fontWeight: 700 }}>Admin</span>
              </div>
              <DownOutlined />
            </Space>
          </a>
        </Dropdown>
      </Space>
    </header>
  );
}
