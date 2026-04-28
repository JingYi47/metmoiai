import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProductCard from "../../components/ProductCard";
import { productApi, aiApi } from "../../services/api";

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const q = useMemo(() => (params.get("q") ?? "").trim(), [params]);
  const isVisual = useMemo(() => params.get("visual") === "true", [params]);
  const fileName = useMemo(() => params.get("fileName"), [params]);

  const [visualImagePreview, setVisualImagePreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. XỬ LÝ TÌM KIẾM BẰNG HÌNH ẢNH
    const visualFile = location.state?.visualFile;
    if (location.state?.visualSearchMode && visualFile) {
      setLoading(true);
      
      // Tạo preview ảnh đã upload
      const reader = new FileReader();
      reader.onloadend = () => setVisualImagePreview(reader.result);
      reader.readAsDataURL(visualFile);

      aiApi
        .visualSearch(visualFile)
        .then((res) => {
          const raw = (res && res.success) ? (res.results || res.products || []) : [];
          setProducts(
            raw.map((p) => ({
              id: p?._id || p?.id,
              slug: p?.slug,
              name: p?.name || "Sản phẩm không tên",
              price: p?.price || 0,
              originalPrice: p?.originalPrice ?? (p?.discountPrice ? p?.price : Math.round((p?.price ?? 0) * 1.2)),
              rating: p?.rating ?? 4.5,
              reviewCount: p?.reviewCount ?? 0,
              images: (p?.images && p.images.length > 0) ? p.images : [{ url: p?.thumbnail || "" }],
            }))
          );
        })
        .finally(() => setLoading(false));
      
      return;
    }

    setLoading(true);
    // Use AI Smart Search for better intent-based results
    aiApi
      .smartSearchDify(q || '')
      .then((res) => {
        const raw = (res && res.success) ? (res.results || res.products || []) : [];
        setProducts(
          raw.map((p) => ({
            id: p?._id || p?.id,
            slug: p?.slug,
            name: p?.name || "Sản phẩm không tên",
            price: p?.price || 0,
            originalPrice: p?.originalPrice ?? (p?.discountPrice ? p?.price : Math.round((p?.price ?? 0) * 1.2)),
            rating: p?.avgRating ?? 4.5,
            reviewCount: p?.reviewCount ?? 0,
            images: (p?.images && p.images.length > 0) ? p.images : [{ url: p?.thumbnail || "" }],
          }))
        );
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q, location.state]);

  return (
    <>
      <Header />

      <main className="container" style={{ minHeight: '60vh' }}>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>Trang chủ</span> / <strong>Tìm kiếm</strong>
        </div>

        <h2 className="page-title" style={{ marginTop: 20, fontSize: '24px', fontWeight: 'bold' }}>
          {visualImagePreview ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>Sản phẩm tương tự với ảnh:</span>
              <img src={visualImagePreview} alt="Query" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #007bff' }} />
            </div>
          ) : (
            <>Kết quả cho: {q ? <span style={{ color: '#007bff' }}>&ldquo;{q}&rdquo;</span> : "—"}</>
          )}
        </h2>


        {loading ? (
          <p style={{ textAlign: "center", padding: "32px 0" }}>Đang tìm kiếm thông minh...</p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: "center", padding: "32px 0" }}>
            {visualImagePreview 
              ? "Không tìm thấy sản phẩm tương tự. Bạn hãy thử đồng bộ lại AI hoặc dùng ảnh khác nhé." 
              : (q ? "Không tìm thấy sản phẩm." : "Hãy nhập từ khóa để tìm kiếm.")}
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

