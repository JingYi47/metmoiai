import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProductCard from "../../components/ProductCard";
import { productApi, categoryApi } from "../../services/api";
import "../home/home.css";

function normalizeProduct(p) {
  const price = p.price ?? 0;
  const originalPrice =
    p.originalPrice ??
    (p.discountPrice ? price : Math.round((price ?? 0) * 1.2));

  return {
    id: p._id || p.id,
    name: p.name,
    price,
    originalPrice,
    rating: p.avgRating ?? p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 0,
    images: p.images?.length ? p.images : [{ url: p.imageUrl ?? "" }],
  };
}

export default function ProductsPage({ defaultCategory }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { type, category } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      type: (params.get("type") ?? "all").toLowerCase(),
      category: params.get("category") || defaultCategory,
    };
  }, [location.search, defaultCategory]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const runner = async () => {
      try {
        if (category) {
          // 🚀 HYBRID SEARCH: Kết hợp lấy theo slug và tìm kiếm từ khóa để "gom" đủ sản phẩm
          const [catRes, searchRes] = await Promise.all([
            categoryApi.getProductsBySlug(category).catch(() => []),
            productApi.search(category).catch(() => [])
          ]);

          const catRaw = catRes.products ?? catRes.data ?? catRes ?? [];
          const searchRaw = searchRes.products ?? searchRes.results ?? searchRes ?? [];
          
          const combined = [...(Array.isArray(catRaw) ? catRaw : []), ...(Array.isArray(searchRaw) ? searchRaw : [])];
          
          // Loại bỏ trùng lặp dựa trên ID
          const seen = new Set();
          const unique = combined.filter(p => {
            const id = p._id || p.id;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });

          setProducts(unique.map(normalizeProduct));
          return;
        }

        if (type === "featured") {
          const res = await productApi.getFeatured();
          const raw = res.products ?? res ?? [];
          setProducts(Array.isArray(raw) ? raw.map(normalizeProduct) : []);
          return;
        }

        if (type === "new" || type === "new-arrivals") {
          const res = await productApi.getNewArrivals();
          const raw = res.products ?? res ?? [];
          setProducts(Array.isArray(raw) ? raw.map(normalizeProduct) : []);
          return;
        }

        if (type === "sale" || type === "on-sale" || type === "onsale") {
          const res = await productApi.getOnSale();
          const raw = res.products ?? res ?? [];
          setProducts(Array.isArray(raw) ? raw.map(normalizeProduct) : []);
          return;
        }

        const res = await productApi.getAll({
          limit: 20,
          page: 1,
          sortBy: "newest",
        });
        const raw = res.products ?? res ?? [];
        setProducts(Array.isArray(raw) ? raw.map(normalizeProduct) : []);
      } catch (e) {
        console.error("Lỗi tải sản phẩm:", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    runner();
  }, [type, category]);

  const categoryName = useMemo(() => {
    if (!category) return "";
    if (products.length > 0) {
      const firstProd = products[0];
      if (firstProd.category && typeof firstProd.category === "object") {
        return firstProd.category.name;
      }
    }
    // Prettify slug: iphone -> iPhone, laptop -> Laptop, may-tinh-bang -> Máy tính bảng (best guess)
    const map = {
      iphone: "iPhone",
      laptop: "Laptop",
      ipad: "iPad",
      loa: "Loa & Âm thanh",
      "tai-nghe": "Tai nghe",
      "may-tinh-bang": "Máy tính bảng",
    };
    return (
      map[category.toLowerCase()] ||
      category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
    );
  }, [category, products]);

  const title = category
    ? categoryName
    : type === "featured"
      ? "Gợi ý cho bạn"
      : type === "new" || type === "new-arrivals"
        ? "Sản phẩm mới về"
        : type === "sale"
          ? "Khuyến mãi hấp dẫn"
          : "Tất cả sản phẩm";

  return (
    <>
      <Header />

      <main className="container" style={{ paddingBottom: "60px" }}>
        <div className="breadcrumb" style={{ padding: "16px 40px" }}>
          <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            Trang chủ
          </span>{" "}
          / <strong>{title}</strong>
        </div>

        <h2
          className="page-title"
          style={{ marginTop: 12, padding: "0 40px", fontSize: "2rem" }}
        >
          {title}
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="loader" style={{ margin: "0 auto" }}></div>
            <p style={{ marginTop: "12px", color: "#666" }}>Đang tải danh sách sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "1.2rem", color: "#888" }}>
              Rất tiếc, hiện tại chưa có sản phẩm nào trong danh mục này.
            </p>
            <button 
              onClick={() => navigate("/")}
              style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px" }}
            >
              Quay lại trang chủ
            </button>
          </div>
        ) : (
          <div className="product-grid" style={{ marginTop: 20 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

