import React, { useEffect, useState } from "react";
import { Button, Popconfirm, message } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { adminCategoryApi } from "../../../utils/apiClient";

const imageFor = (name: string) => {
  const map: Record<string, string> = {
    Iphone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=60",
    Tivi: "https://images.unsplash.com/photo-1584905066893-7d5c142ba4e1?auto=format&fit=crop&w=900&q=60",
    Ipad: "https://images.unsplash.com/photo-1587033411391-5e4f5d5d8d7d?auto=format&fit=crop&w=900&q=60",
    HeadPhones: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=60",
    MiniSpeaker: "https://images.unsplash.com/photo-1518441902117-f0a2b5d4e1c0?auto=format&fit=crop&w=900&q=60",
  };
  return map[name] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=60";
};

const getProductCount = (category: any) => {
  const raw =
    category?.productCount ??
    category?.productsCount ??
    category?.totalProducts ??
    (Array.isArray(category?.products) ? category.products.length : undefined);

  const count = Number(raw);
  return Number.isFinite(count) && count >= 0 ? count : 0;
};

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminCategoryApi.getAll()
      .then((data: any) => setCategories(Array.isArray(data) ? data : data.categories ?? []))
      .catch(() => message.error("Không tải được danh mục"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminCategoryApi.delete(id);
      message.success("Đã xoá danh mục");
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      message.error(err.message || "Lỗi xoá danh mục");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Danh mục thể loại</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/categories/new")}>Thêm</Button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: 40 }}>Đang tải...</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {categories.map((c) => (
            <div key={c._id} className="card" style={{ overflow: "hidden" }}>
              <div style={{ position: "relative", height: 220, background: "#f3f4f6" }}>
                <img
                  src={c.image ?? imageFor(c.name)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{c.name}</div>
                  <div style={{ color: "#6b7280" }}>{getProductCount(c)} sản phẩm</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button icon={<EditOutlined />} onClick={() => navigate(`/categories/${c._id}/edit`)} />
                  <Popconfirm title="Xoá danh mục này?" onConfirm={() => handleDelete(c._id)}>
                    <Button danger>Xoá</Button>
                  </Popconfirm>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
