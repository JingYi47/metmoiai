import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProductCard from "../../components/ProductCard";
import { productApi } from "../../services/api";
import "../home/home.css";

function normalizeProduct(p) {
  const price = p.price ?? 0;
  const originalPrice =
    p.originalPrice ??
    (p.discountPrice ? price : Math.round((price ?? 0) * 1.2));

  return {
    id: p._id,
    name: p.name,
    price,
    originalPrice,
    rating: p.avgRating ?? p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 0,
    images: p.images?.length ? p.images : [{ url: p.imageUrl ?? "" }],
  };
}

export default function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const type = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("type") ?? "all").toLowerCase();
  }, [location.search]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const runner = async () => {
      try {
        if (type === "featured") {
          const res = await productApi.getFeatured();
          const raw = res.products ?? res ?? [];
          setProducts(raw.map(normalizeProduct));
          return;
        }

        if (type === "new" || type === "new-arrivals") {
          const res = await productApi.getNewArrivals();
          const raw = res.products ?? res ?? [];
          setProducts(raw.map(normalizeProduct));
          return;
        }

        if (type === "sale" || type === "on-sale" || type === "onsale") {
          const res = await productApi.getOnSale();
          const raw = res.products ?? res ?? [];
          setProducts(raw.map(normalizeProduct));
          return;
        }

        const res = await productApi.getAll({ limit: 20, page: 1, sortBy: "newest" });
        const raw = res.products ?? res ?? [];
        setProducts(raw.map(normalizeProduct));
      } catch (e) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    runner();
  }, [type]);

  const title =
    type === "featured"
      ? "Sản phẩm nổi bật"
      : type === "new"
        ? "Sản phẩm mới"
        : type === "sale"
          ? "Sản phẩm đang giảm giá"
          : "Tất cả sản phẩm";

  return (
    <>
      <Header />

      <main className="container">
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>Trang chủ</span> / <strong>{title}</strong>
        </div>

        <h2 className="page-title" style={{ marginTop: 12 }}>
          {title}
        </h2>

        {loading ? (
          <p style={{ textAlign: "center", padding: "32px 0" }}>Đang tải...</p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: "center", padding: "32px 0", color: "#888" }}>
            Không có sản phẩm để hiển thị.
          </p>
        ) : (
          <div className="product-grid" style={{ marginTop: 16 }}>
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

