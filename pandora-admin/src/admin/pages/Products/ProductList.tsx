import React, { useState, useEffect } from "react";
import { Button, Input, Select, Space, Table, Tag, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { adminProductApi } from "../../../utils/apiClient";
import { currencyVND } from "../../mocks/db";

const DEFAULT_PAGE_SIZE = 12;

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
    };
    const q = query.trim();
    if (q) params.q = q;
    if (filter === "in") params.stock = "in";
    if (filter === "out") params.stock = "out";

    adminProductApi
      .getAll(params)
      .then((data) => {
        setProducts(data.products ?? data ?? []);
        setTotal(typeof data.total === "number" ? data.total : (data.products ?? []).length);
      })
      .catch(() => message.error("Không tải được sản phẩm"))
      .finally(() => setLoading(false));
  }, [page, pageSize, filter, query]);

  const handleDelete = async (id: string) => {
    try {
      await adminProductApi.delete(id);
      message.success("Đã xoá sản phẩm");
      const lastOnPage = products.length <= 1;
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (lastOnPage && page > 1) setPage(page - 1);
    } catch (err: any) {
      message.error(err.message || "Lỗi xoá sản phẩm");
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={r.images?.[0]?.url ?? r.imageUrl ?? ""}
            width={36} height={36}
            style={{ borderRadius: 8, objectFit: "cover", background: "#f0f0f0" }}
          />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </div>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "totalStock",
      key: "totalStock",
      render: (_v, r) => {
        const stock = r.totalStock ?? r.stock ?? 0;
        return stock > 0 ? `${stock} sản phẩm` : <Tag style={{ borderRadius: 8 }}>Hết hàng</Tag>;
      },
    },
    { title: "Giá", dataIndex: "price", key: "price", align: "right", render: (v: number) => currencyVND(v) },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (_v, r) => {
        const hidden = r.isHidden ?? !r.isActive;
        return (
          <Tag color={hidden ? "red" : "green"} style={{ borderRadius: 8 }}>
            {hidden ? "Ẩn" : "Hiện"}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/products/${r._id}/edit`)} />
          <Popconfirm title="Xoá sản phẩm này?" onConfirm={() => handleDelete(r._id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Sản phẩm</h1></div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 10 }} onClick={() => navigate("/products/new")}>
            Thêm
          </Button>
        </Space>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <Select
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            style={{ width: 180 }}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "in", label: "Còn hàng" },
              { value: "out", label: "Hết hàng" },
            ]}
          />
          <Input
            prefix={<span style={{ opacity: 0.6 }}>🔍</span>}
            placeholder="Tìm kiếm"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: 360 }}
          />
        </div>

        <Table
          dataSource={products}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [12, 24, 48],
            showTotal: (t) => `Tổng ${t} sản phẩm`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </div>
    </div>
  );
}
