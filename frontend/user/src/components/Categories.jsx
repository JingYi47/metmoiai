import React, { useState, useEffect } from "react";
import { categoryApi } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Lấy toàn bộ danh mục active giống Header
        const res = await categoryApi.getAll();
        const allCats = res.categories || (Array.isArray(res) ? res : []);
        
        // Sắp xếp: Ưu tiên danh mục có ảnh và isFeatured
        const sorted = [...allCats].sort((a, b) => {
          if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
          return (a.order || 0) - (b.order || 0);
        });

        setCategories(sorted);
      } catch (error) {
        console.error("Lỗi API Categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading || categories.length === 0) return null;

  // Map tên đẹp cho các slug phổ biến (nếu DB chưa chuẩn)
  const nameMap = {
    "iphone": "iPhone",
    "ipad": "iPad",
    "laptop": "Máy tính/Laptop",
    "headphone": "Tai nghe",
    "tai-nghe": "Tai nghe",
    "sac-du-phong": "Sạc dự phòng",
    "op-lung": "Ốp lưng",
    "djong-ho-thong-minh": "Đồng hồ",
    "may-tinh-bang": "Máy tính bảng",
    "day-sac": "Dây sạc",
    "android": "Android"
  };

  return (
    <section className="categories">
      <div className="section-header">
        <h2 style={{ marginBottom: "20px", fontSize: "1.8rem", fontWeight: "700" }}>
          Danh mục phổ biến
        </h2>
        <span 
          className="view-all-text" 
          style={{ color: "#007bff", cursor: "pointer", fontWeight: "600" }}
          onClick={() => navigate("/products")}
        >
          Xem tất cả →
        </span>
      </div>

      <div className="category-list">
        {categories.map((cat) => {
          const displayName = nameMap[cat.slug?.toLowerCase()] || cat.name;
          
          return (
            <div
              className="category"
              key={cat._id}
              onClick={() => navigate(`/products?category=${cat.slug}`)}
            >
              <div className="img-wrapper">
                <img
                  src={cat.image || "https://res.cloudinary.com/deuyaqjju/image/upload/v1/placeholder-category.png"}
                  alt={displayName}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/100?text=" + displayName;
                  }}
                />
              </div>
              <p>{displayName}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
