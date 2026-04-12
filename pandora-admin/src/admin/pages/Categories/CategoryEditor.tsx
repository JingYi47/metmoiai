import React, { useState, useEffect } from "react";
import { Button, Card, Input, List, Space, Switch, message } from "antd";
import { EditOutlined, PlusOutlined, HolderOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { Category } from "../../../types";
import { adminCategoryApi, adminProductApi } from "../../../utils/apiClient";

export function CategoryEditor({ mode, category }: { mode: "create" | "edit"; category?: Category | null }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [name, setName] = useState(category?.name ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [productsIn, setProductsIn] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category?.slug) {
      adminProductApi.getAll({ category: category.slug })
        .then((data: any) => setProductsIn(data.products ?? []))
        .catch(() => {});
    }
  }, [category]);

  useEffect(() => {
    setName(category?.name ?? "");
    setImageFile(null);
    setImagePreview("");
  }, [category]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const onSave = async () => {
    if (!name.trim()) { message.warning("Nhập tên danh mục"); return; }
    setLoading(true);
    try {
      if (mode === "create") {
        await adminCategoryApi.create(imageFile ? { name, imageFile } : { name });
        message.success("Đã tạo danh mục");
      } else if (category) {
        const payload = imageFile ? { name, imageFile } : { name };
        await adminCategoryApi.update(category._id, payload);
        message.success("Đã lưu thay đổi");
      }
      navigate("/categories");
    } catch (err: any) {
      message.error(err.message || "Lỗi lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <a onClick={() => navigate(-1)} style={{ color: "#6b7280" }}>← Back</a>
          <h1 className="page-title" style={{ marginTop: 6 }}>
            {mode === "create" ? "Tạo danh mục" : (name || "Chỉnh sửa danh mục")}
          </h1>
        </div>
        <Space>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="primary" onClick={onSave} loading={loading}>Save</Button>
        </Space>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 0.6fr" }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Tên danh mục</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên danh mục" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Ảnh danh mục</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setImageFile(f);
              }}
            />

            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
              {(imagePreview || category?.image) ? (
                <img
                  src={imagePreview || category?.image || ""}
                  width={56}
                  height={56}
                  style={{ borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }}
                  alt="Category"
                />
              ) : (
                <div style={{ color: "#6b7280", fontSize: 13 }}>Chưa có ảnh</div>
              )}
              {imageFile && (
                <Button onClick={() => setImageFile(null)} type="default">
                  Bỏ ảnh
                </Button>
              )}
            </div>
          </div>

          <div style={{ fontWeight: 700, marginBottom: 14 }}>
            Sản phẩm <span style={{ color: "#6b7280", fontWeight: 600 }}>{productsIn.length}</span>
          </div>

          <List
            dataSource={productsIn}
            renderItem={(p: any) => (
              <List.Item actions={[<Button key="edit" type="text" icon={<EditOutlined />} onClick={() => navigate(`/products/${p._id}/edit`)} />]}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <HolderOutlined style={{ color: "#94a3b8" }} />
                  <img
                    src={p.images?.[0]?.url ?? p.imageUrl ?? ""}
                    width={22} height={22}
                    style={{ borderRadius: 6, objectFit: "cover" }}
                  />
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                </div>
              </List.Item>
            )}
          />

          <Button type="link" icon={<PlusOutlined />} style={{ marginTop: 10 }} onClick={() => navigate("/products/new")}>
            Thêm sản phẩm
          </Button>
        </div>

        <Card className="card" bodyStyle={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Category Visibility</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch checked={visible} onChange={setVisible} />
            <span>Visible on site</span>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
        <Button onClick={() => navigate(-1)}>Cancel</Button>
        <Button type="primary" onClick={onSave} loading={loading}>Save</Button>
      </div>
    </div>
  );
}
