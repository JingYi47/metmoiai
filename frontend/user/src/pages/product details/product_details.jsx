import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { productApi, cartApi, reviewApi, wishlistApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProductSection from "../../components/ProductSection";
import "./product_details.css";

function StarRating({ value = 0, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="star-row">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star ${s <= (hover || value) ? "filled" : ""} ${readonly ? "" : "clickable"}`}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange && onChange(s)}
        >★</span>
      ))}
    </span>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null); // full color object
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addMsg, setAddMsg] = useState("");
  const [tab, setTab] = useState("desc"); // desc | specs | reviews
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    productApi.getById(id)
      .then((data) => {
        const p = data.product ?? data;
        setProduct(p);
        const firstColor = p.colors?.length ? p.colors[0] : null;
        setSelectedColor(firstColor);
        const catSlug = typeof p.category === "object" ? p.category?.slug : null;
        if (catSlug) return productApi.getAll({ category: catSlug });
      })
      .then((relData) => {
        if (relData) {
          const items = relData.products ?? relData ?? [];
          setRelated(
            items.filter((r) => r._id !== id).slice(0, 8).map((r) => ({
              id: r._id,
              name: r.name,
              price: r.price,
              originalPrice: r.originalPrice ?? Math.round((r.price ?? 0) * 1.2),
              rating: r.avgRating ?? r.rating ?? 4.5,
              reviewCount: r.reviewCount ?? 0,
              images: r.images?.length ? r.images : [{ url: r.imageUrl ?? "" }],
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === "reviews") {
      reviewApi.getByProduct(id)
        .then((d) => setReviews(d.reviews ?? []))
        .catch(() => {});
    }
  }, [tab, id]);

  // Build a full gallery: main product images + any unique color images
  const mainImages = product?.images?.length ? product.images : [{ url: product?.imageUrl ?? "" }];
  const seenUrls = new Set(mainImages.map((i) => i.url));
  const extraColorImages = (product?.colors ?? [])
    .flatMap((c) => c.images ?? [])
    .filter((i) => i?.url && !seenUrls.has(i.url));
  const allImages = [...mainImages, ...extraColorImages];

  const colorStock = selectedColor?.stock ?? product?.stock ?? 0;
  const inStock = colorStock > 0;

  const handleAddToCart = async () => {
    if (!user) {
      setAddMsg("Vui lòng đăng nhập để thêm vào giỏ");
      setTimeout(() => setAddMsg(""), 3000);
      return;
    }
    try {
      await cartApi.add(id, qty, selectedColor?.name ?? "");
      setAddMsg("Đã thêm vào giỏ hàng ✓");
    } catch (err) {
      const msg = err.message || "Lỗi thêm vào giỏ";
      setAddMsg("❌ " + msg);
      console.error("[AddToCart]", msg);
    }
    setTimeout(() => setAddMsg(""), 4000);
  };

  const handleBuyNow = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      await cartApi.add(id, qty, selectedColor?.name ?? "");
      navigate("/cart");
    } catch (err) {
      setAddMsg(err.message || "Lỗi");
      setTimeout(() => setAddMsg(""), 3000);
    }
  };

  const handleWishlist = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      if (wishlisted) { await wishlistApi.remove(id); setWishlisted(false); }
      else { await wishlistApi.add(id); setWishlisted(true); }
    } catch {}
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setReviewMsg("Vui lòng đăng nhập để đánh giá"); return; }
    setSubmitting(true);
    try {
      await reviewApi.createOrUpdate(id, myRating, myComment);
      setReviewMsg("Đã gửi đánh giá ✓");
      setMyComment("");
      const d = await reviewApi.getByProduct(id);
      setReviews(d.reviews ?? []);
    } catch (err) {
      setReviewMsg(err.message || "Lỗi gửi đánh giá");
    } finally {
      setSubmitting(false);
      setTimeout(() => setReviewMsg(""), 4000);
    }
  };

  if (loading) return <><Header /><div className="pd-loading">Đang tải...</div><Footer /></>;
  if (!product) return <><Header /><div className="pd-loading">Không tìm thấy sản phẩm</div><Footer /></>;

  const colors = product.colors ?? [];
  const specs = product.specifications
    ? Object.entries(typeof product.specifications === "object" ? product.specifications : {})
    : [];

  const mainPrice = product.price ?? product.originalPrice ?? 0;
  const strikePrice =
    product.originalPrice && product.originalPrice > mainPrice ? product.originalPrice : null;
  const discountPct = strikePrice
    ? Math.round(((strikePrice - mainPrice) / strikePrice) * 100)
    : 0;

  const avgRating = product.avgRating ?? product.rating ?? 0;

  const category =
    typeof product.category === "object" ? product.category : null;

  return (
    <>
      <Header />

      <div className="pd-page">
        {/* BREADCRUMB */}
        <nav className="pd-breadcrumb">
          <span onClick={() => navigate("/")}>Trang chủ</span>
          {category && (
            <>
              <span className="sep">›</span>
              <span onClick={() => navigate(`/category/${category.slug ?? category._id}`)}>{category.name}</span>
            </>
          )}
          <span className="sep">›</span>
          <span className="current">{product.name}</span>
        </nav>

        {/* MAIN CARD */}
        <div className="pd-card">
          {/* ── LEFT: Gallery ── */}
          <div className="pd-gallery">
            <div className="pd-thumbs">
              {allImages.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt=""
                  className={i === activeImg ? "active" : ""}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
            <div className="pd-main-img">
              <img src={allImages[activeImg]?.url} alt={product.name} />
              {discountPct > 0 && (
                <span className="pd-discount-badge">-{discountPct}%</span>
              )}
            </div>
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="pd-info">
            {product.brand && <p className="pd-brand">{product.brand}</p>}
            <h1 className="pd-title">{product.name}</h1>

            {/* Rating row */}
            <div className="pd-rating-row">
              <StarRating value={Math.round(avgRating)} readonly />
              <span className="pd-rating-val">{avgRating > 0 ? avgRating.toFixed(1) : "Chưa có"}</span>
              <span className="pd-rating-count">({product.reviewCount ?? 0} đánh giá)</span>
              <span className="pd-divider">|</span>
              <span className={`pd-stock ${inStock ? "in" : "out"}`}>
                {inStock ? `Còn ${colorStock} sản phẩm` : "Hết hàng"}
              </span>
            </div>

            {/* Price */}
            <div className="pd-price-block">
              <span className="pd-price">{mainPrice.toLocaleString("vi-VN")}đ</span>
              {strikePrice && (
                <span className="pd-original-price">{strikePrice.toLocaleString("vi-VN")}đ</span>
              )}
            </div>

            {/* Short description */}
            <p className="pd-short-desc">{product.description}</p>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="pd-color-section">
                <p className="pd-label">
                  Màu sắc: <strong>{selectedColor?.name ?? ""}</strong>
                </p>
                <div className="pd-color-list">
                  {colors.map((c, i) => {
                    const name = typeof c === "string" ? c : c.name;
                    const code = typeof c === "string" ? "#ccc" : (c.code ?? "#ccc");
                    const active = selectedColor?.name === name || selectedColor === c;
                    return (
                      <button
                        key={i}
                        className={`pd-color-btn ${active ? "active" : ""}`}
                        onClick={() => {
                        setSelectedColor(c);
                        if (c.images?.length) {
                          const idx = allImages.findIndex((img) => img.url === c.images[0].url);
                          setActiveImg(idx >= 0 ? idx : 0);
                        } else {
                          setActiveImg(0);
                        }
                      }}
                        title={name}
                      >
                        <span className="pd-color-swatch" style={{ background: code }} />
                        <span className="pd-color-name">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Qty + Buttons */}
            <div className="pd-buy-section">
              <div className="pd-qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button
                className="pd-btn-cart"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                Thêm vào giỏ
              </button>
              <button
                className="pd-btn-buy"
                onClick={handleBuyNow}
                disabled={!inStock}
              >
                Mua ngay
              </button>
              <button
                className={`pd-btn-wish ${wishlisted ? "active" : ""}`}
                onClick={handleWishlist}
                title={wishlisted ? "Bỏ yêu thích" : "Yêu thích"}
              >
                {wishlisted ? "♥" : "♡"}
              </button>
            </div>

            {addMsg && (
              <p className={`pd-add-msg ${addMsg.includes("✓") ? "success" : "error"}`}>{addMsg}</p>
            )}

            {/* Services */}
            <div className="pd-services">
              <div className="pd-sv"><span>🚚</span><div><strong>Giao hàng miễn phí</strong><p>Cho đơn hàng trên 500.000đ</p></div></div>
              <div className="pd-sv"><span>🔄</span><div><strong>Đổi trả 30 ngày</strong><p>Hoàn tiền nếu không vừa ý</p></div></div>
              <div className="pd-sv"><span>🛡️</span><div><strong>Bảo hành chính hãng</strong><p>12 tháng tại trung tâm</p></div></div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="pd-tabs-card">
          <div className="pd-tabs">
            <button className={tab === "desc" ? "active" : ""} onClick={() => setTab("desc")}>Mô tả sản phẩm</button>
            {specs.length > 0 && (
              <button className={tab === "specs" ? "active" : ""} onClick={() => setTab("specs")}>Thông số kỹ thuật</button>
            )}
            <button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>
              Đánh giá ({product.reviewCount ?? 0})
            </button>
          </div>

          <div className="pd-tab-content">
            {/* DESCRIPTION */}
            {tab === "desc" && (
              <div className="pd-desc-tab">
                <p>{product.description}</p>
              </div>
            )}

            {/* SPECS */}
            {tab === "specs" && (
              <div className="pd-specs-tab">
                <table className="pd-specs-table">
                  <tbody>
                    {specs.map(([k, v], i) => (
                      <tr key={i} className={i % 2 === 0 ? "even" : ""}>
                        <td className="spec-key">{k}</td>
                        <td className="spec-val">{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REVIEWS */}
            {tab === "reviews" && (
              <div className="pd-reviews-tab">
                {/* Rating summary */}
                <div className="pd-rating-summary">
                  <div className="pd-avg-score">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
                  <div>
                    <StarRating value={Math.round(avgRating)} readonly />
                    <p>{product.reviewCount ?? 0} đánh giá</p>
                  </div>
                </div>

                {/* Review list */}
                {reviews.length === 0 ? (
                  <p className="pd-no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                ) : (
                  <div className="pd-review-list">
                    {reviews.map((r) => (
                      <div key={r._id} className="pd-review-item">
                        <div className="pd-rv-head">
                          <span className="pd-rv-avatar">
                            {(r.user?.firstName?.[0] ?? "U").toUpperCase()}
                          </span>
                          <div>
                            <strong>{r.user?.firstName ?? ""} {r.user?.lastName ?? ""}</strong>
                            <StarRating value={r.rating} readonly />
                          </div>
                          <span className="pd-rv-date">
                            {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        {r.comment && <p className="pd-rv-comment">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Write review */}
                <div className="pd-write-review">
                  <h4>Viết đánh giá của bạn</h4>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="pd-rv-form-row">
                      <label>Số sao:</label>
                      <StarRating value={myRating} onChange={setMyRating} />
                    </div>
                    <textarea
                      placeholder="Nhận xét của bạn (không bắt buộc)"
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      rows={4}
                    />
                    <button type="submit" className="pd-rv-submit" disabled={submitting}>
                      {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                    {reviewMsg && (
                      <p className={`pd-add-msg ${reviewMsg.includes("✓") ? "success" : "error"}`}>{reviewMsg}</p>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <div className="pd-related">
            <ProductSection title="Sản phẩm tương tự" products={related} />
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
