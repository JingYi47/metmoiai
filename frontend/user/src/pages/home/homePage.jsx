import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import Hero from "../../components/Hero";
import Categories from "../../components/Categories";
import ProductSection from "../../components/ProductSection";
import FlashSale from "../../components/FlashSale";
import Services from "../../components/Services";
// IMPORT CÁC API TỪ SOURCE GỐC
import { productApi, chatApi } from "../../services/api";
import "./home.css";

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [onSale, setOnSale] = useState([]);
  const [aiSections, setAiSections] = useState([]);
  const [promoMessage, setPromoMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Hàm chuẩn hoá dữ liệu an toàn
  const normalize = (p) => {
    if (!p) return {};
    return {
      id: p._id || p.id,
      name: p.name || "Sản phẩm không tên",
      price: p.price || 0,
      originalPrice: p.originalPrice || Math.round((p.price || 0) * 1.2),
      rating: p.rating || p.avgRating || 4.5,
      reviewCount: p.reviewCount || 0,
      images: p.images?.length ? p.images : [{ url: p.imageUrl || "" }],
      slug: p.slug || "",
    };
  };

  useEffect(() => {
    let isMounted = true; // Tránh leak memory
    setLoading(true);

    Promise.all([
      productApi.getFeatured().catch(() => ({ products: [] })),
      productApi.getNewArrivals().catch(() => ({ products: [] })),
      productApi.getOnSale().catch(() => ({ products: [] })),
      chatApi
        .getAIRecommendations()
        .catch(() => ({ sections: [], promotionMessage: "" })),
    ])
      .then(([featuredData, newData, saleData, aiData]) => {
        if (!isMounted) return;

        // Xử lý dữ liệu Featured
        setFeatured(
          featuredData?.products ||
            (Array.isArray(featuredData) ? featuredData : []),
        );

        // Xử lý dữ liệu New Arrivals
        setNewArrivals(
          newData?.products || (Array.isArray(newData) ? newData : []),
        );

        // Xử lý dữ liệu On Sale
        setOnSale(
          saleData?.products || (Array.isArray(saleData) ? saleData : []),
        );

        // Xử lý dữ liệu AI (Đảm bảo luôn là mảng)
        setAiSections(aiData?.sections || []);
        setPromoMessage(aiData?.promotionMessage || "");

        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải dữ liệu:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        {/* Banner thông báo từ AI - Thêm hiệu ứng đẹp */}
        {promoMessage && (
          <div className="ai-alert-banner">
            <p>
              ✨ <strong>Gợi ý thông minh:</strong> {promoMessage}
            </p>
          </div>
        )}

        <Hero />
        <Categories />

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div className="loader"></div>
            <p>Đang tải không gian mua sắm cá nhân của bạn...</p>
          </div>
        ) : (
          <>
            {/* HIỂN THỊ DỮ LIỆU CÁ NHÂN HÓA ĐẦU TIÊN (Đã sửa lỗi .map) */}
            {aiSections &&
              aiSections.length > 0 &&
              aiSections.map(
                (section) =>
                  section?.products?.length > 0 && (
                    <ProductSection
                      key={section.id || Math.random()}
                      title={section.title}
                      subtitle={section.subtitle}
                      products={section.products.map(normalize)}
                    />
                  ),
              )}

            {featured.length > 0 && (
              <ProductSection
                title="Sản phẩm nổi bật"
                products={featured.map(normalize)}
                viewAllPath="/products?type=featured"
              />
            )}

            {newArrivals.length > 0 && (
              <ProductSection
                title="Sản phẩm mới"
                products={newArrivals.map(normalize)}
                viewAllPath="/products?type=new"
              />
            )}

            {onSale.length > 0 && (
              <>
                <FlashSale />
                <ProductSection
                  products={onSale.map(normalize)}
                  showHeader={false}
                  loadMorePath="/products?type=sale"
                />
              </>
            )}
          </>
        )}
        <Services />
      </main>
      <Footer />
    </>
  );
}
