import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProductCard from "../../components/ProductCard";
import { useState, useEffect } from "react";
import "./FavoritePage.css";
import { MdDeleteOutline } from "react-icons/md";
import { wishlistApi, productApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function FavoritePage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    wishlistApi.get()
      .then((data) => {
        const items = data.wishlist ?? data ?? [];
        setFavorites(items);
      })
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));

    productApi.getFeatured()
      .then((data) => setRecommended(data.products ?? data ?? []))
      .catch(() => {});
  }, [user]);

  const handleRemove = async (productId) => {
    setFavorites((prev) => prev.filter((p) => (p._id ?? p.id) !== productId));
    try { await wishlistApi.remove(productId); } catch (_) {}
  };

  // Chuẩn hoá shape
  const normalize = (p) => ({
    id: p._id ?? p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.discountPrice ? p.price : Math.round((p.price ?? 0) * 1.2),
    rating: p.avgRating ?? p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 0,
    images: p.images?.length ? p.images : [{ url: p.imageUrl ?? "" }],
  });

  return (
    <>
      <Header />

      <div className="favorite-page">
        <div className="favorite-header">
          <h2>Yêu thích ({favorites.length})</h2>
        </div>

        {loading ? (
          <p style={{ textAlign: "center" }}>Đang tải...</p>
        ) : !user ? (
          <p style={{ textAlign: "center" }}>Vui lòng <a href="/Login">đăng nhập</a> để xem danh sách yêu thích</p>
        ) : favorites.length === 0 ? (
          <p style={{ textAlign: "center" }}>Chưa có sản phẩm yêu thích</p>
        ) : (
          <div className="favorite-grid">
            {favorites.map((item) => {
              const n = normalize(item);
              return (
                <div className="favorite-item" key={n.id}>
                  <button className="delete-icon" onClick={() => handleRemove(n.id)}>
                    <MdDeleteOutline />
                  </button>
                  <ProductCard product={n} />
                </div>
              );
            })}
          </div>
        )}

        {recommended.length > 0 && (
          <>
            <div className="recommend-header">
              <h2>Dành cho bạn</h2>
            </div>
            <div className="favorite-grid">
              {recommended.slice(0, 8).map((item) => (
                <ProductCard key={item._id} product={normalize(item)} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
