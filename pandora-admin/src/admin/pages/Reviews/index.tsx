import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Input,
  Popconfirm,
  Select,
  Table,
  Tag,
  message,
  Rate,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { adminReviewApi } from "../../../utils/apiClient";

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const fetchReviews = () => {
    setLoading(true);
    adminReviewApi
      .getAll({ limit: "200" })
      .then((data: any) => setReviews(data.reviews ?? data ?? []))
      .catch(() => message.error("Không tải được đánh giá"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchReviews, []);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews
      .filter((r) => ratingFilter === "all" || String(r.rating) === ratingFilter)
      .filter((r) => {
        if (!q) return true;
        const productName =
          typeof r.product === "object" ? r.product?.name ?? "" : "";
        const userName =
          typeof r.user === "object"
            ? `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""} ${r.user?.email ?? ""}`
            : "";
        const comment = r.comment ?? "";
        return (
          productName.toLowerCase().includes(q) ||
          userName.toLowerCase().includes(q) ||
          comment.toLowerCase().includes(q)
        );
      });
  }, [reviews, ratingFilter, query]);

  const handleDelete = async (id: string) => {
    try {
      await adminReviewApi.delete(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      message.success("Đã xóa đánh giá");
    } catch (err: any) {
      message.error(err.message || "Lỗi xóa đánh giá");
    }
  };

  const ratingColor: Record<number, string> = {
    5: "green",
    4: "cyan",
    3: "gold",
    2: "orange",
    1: "red",
  };

  const columns: ColumnsType<any> = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, r) => {
        const p = r.product;
        if (!p) return <span style={{ color: "#9ca3af" }}>—</span>;
        const img = p.images?.[0]?.url ?? "";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {img && (
              <img
                src={img}
                alt={p.name}
                style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }}
              />
            )}
            <span style={{ fontWeight: 500 }}>{p.name ?? "—"}</span>
          </div>
        );
      },
    },
    {
      title: "Người dùng",
      key: "user",
      render: (_, r) => {
        const u = r.user;
        if (!u) return <span style={{ color: "#9ca3af" }}>—</span>;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>
              {u.firstName} {u.lastName}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{u.email}</div>
          </div>
        );
      },
    },
    {
      title: "Sao",
      dataIndex: "rating",
      key: "rating",
      width: 160,
      render: (v: number) => (
        <Tag color={ratingColor[v] ?? "default"} style={{ borderRadius: 999, fontWeight: 600 }}>
          <Rate disabled value={v} style={{ fontSize: 12 }} /> &nbsp;{v}
        </Tag>
      ),
    },
    {
      title: "Bình luận",
      dataIndex: "comment",
      key: "comment",
      render: (v) => (
        <span style={{ color: v ? "#374151" : "#9ca3af" }}>
          {v || "(Không có bình luận)"}
        </span>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: fmtDate,
    },
    {
      title: "",
      key: "actions",
      width: 70,
      render: (_, r) => (
        <Popconfirm
          title="Xóa đánh giá này?"
          description="Hành động này không thể hoàn tác."
          onConfirm={() => handleDelete(r._id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            type="text"
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Đánh giá sản phẩm</h1>
          <p className="page-sub">{data.length} đánh giá</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchReviews}>
          Làm mới
        </Button>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <Select
            value={ratingFilter}
            onChange={setRatingFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "Tất cả sao" },
              { value: "5", label: "⭐⭐⭐⭐⭐  (5 sao)" },
              { value: "4", label: "⭐⭐⭐⭐  (4 sao)" },
              { value: "3", label: "⭐⭐⭐  (3 sao)" },
              { value: "2", label: "⭐⭐  (2 sao)" },
              { value: "1", label: "⭐  (1 sao)" },
            ]}
          />
          <Input
            prefix={<span style={{ opacity: 0.6 }}>🔍</span>}
            placeholder="Tìm theo sản phẩm, người dùng, nội dung..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 15, position: ["bottomCenter"] }}
        />
      </div>
    </div>
  );
}
