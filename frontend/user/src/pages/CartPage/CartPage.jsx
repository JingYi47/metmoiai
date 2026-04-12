import Header from "../../components/Header";
import Footer from "../../components/footer";
import "./CartPage.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartApi, couponApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null); // { code, name, discount }
  const [couponMsg, setCouponMsg] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Tải giỏ hàng từ API
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    cartApi.get()
      .then((data) => {
        const cart = data.cart ?? data;
        setCartItems(cart.items ?? []);
        setDiscount(cart.discountApplied ?? 0);
      })
      .catch(() => setCartItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  // Đổi số lượng
  const handleQuantityChange = async (itemId, value) => {
    setCartItems((prev) => prev.map((i) => i._id === itemId ? { ...i, quantity: value } : i));
    try { await cartApi.updateQuantity(itemId, value); } catch (_) {}
  };

  // Xoá sản phẩm
  const handleRemove = async (itemId) => {
    setCartItems((prev) => prev.filter((i) => i._id !== itemId));
    try { await cartApi.removeItem(itemId); } catch (_) {}
  };

  // Toggle chọn
  const handleToggle = async (itemId) => {
    setCartItems((prev) => prev.map((i) => i._id === itemId ? { ...i, isSelected: !i.isSelected } : i));
    try { await cartApi.toggleSelect(itemId); } catch (_) {}
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg("");
    setCouponError("");
    try {
      const selectedSubtotal = cartItems
        .filter((i) => i.isSelected)
        .reduce((s, i) => s + (i.priceAtAddition ?? 0) * i.quantity, 0);
      const res = await couponApi.apply(couponCode.trim(), selectedSubtotal);
      setCouponApplied({ code: res.coupon.code, name: res.coupon.name, discount: res.discount });
      setDiscount(res.discount);
      setCouponMsg(res.message);
    } catch (err) {
      setCouponError(err.message || "Mã không hợp lệ");
      setCouponApplied(null);
      setDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponMsg("");
    setCouponError("");
    setDiscount(0);
  };

  const totalPrice = cartItems
    .filter((i) => i.isSelected)
    .reduce((sum, i) => sum + (i.priceAtAddition ?? 0) * i.quantity, 0);
  const finalTotal = Math.max(totalPrice - discount, 0);

  const handleCheckout = () => {
    const selectedItems = cartItems.filter((i) => i.isSelected);
    if (selectedItems.length === 0) { alert("Vui lòng chọn ít nhất 1 sản phẩm"); return; }
    const checkoutData = {
      items: selectedItems.map((i) => ({
        product: i.product?._id ?? i.productId,
        name: i.product?.name ?? i.name,
        price: i.priceAtAddition,
        quantity: i.quantity,
        color: i.color,
        total: i.priceAtAddition * i.quantity,
        image: i.product?.images?.[0]?.url ?? i.product?.imageUrl ?? "",
      })),
      subtotal: totalPrice,
      shippingFee: 0,
      discount,
      couponCode: couponApplied?.code ?? "",
      total: finalTotal,
    };
    navigate("/checkout", { state: checkoutData });
  };

  if (!user) return (
    <>
      <Header />
      <main className="cp-page"><p style={{ textAlign: "center", padding: 40 }}>
        Vui lòng <a href="/Login">đăng nhập</a> để xem giỏ hàng
      </p></main>
      <Footer />
    </>
  );

  return (
    <>
      <Header />

      <main className="cp-page">
        <div className="cp-container">
          <div className="cp-layout">
            {/* LEFT */}
            <div className="cp-left">
              <div className="cp-header">
                <span>Sản phẩm</span>
                <span>Giá</span>
                <span>Số lượng</span>
                <span>Thành tiền</span>
              </div>

              {loading && <p className="cp-empty">Đang tải...</p>}
              {!loading && cartItems.length === 0 && (
                <p className="cp-empty">Giỏ hàng của bạn đang trống 🛒</p>
              )}

              {cartItems.map((item) => {
                const product = item.product ?? {};
                const imgUrl = product.images?.[0]?.url ?? product.imageUrl ?? "";
                return (
                  <div className="cp-item" key={item._id}>
                    <div className="cp-product">
                      <input
                        type="checkbox"
                        checked={!!item.isSelected}
                        onChange={() => handleToggle(item._id)}
                      />
                      <img src={imgUrl} alt={product.name} />
                      <div>
                        <span>{product.name}</span>
                        <small>Màu: {item.color}</small>
                      </div>
                    </div>

                    <div className="cp-price">
                      {(item.priceAtAddition ?? 0).toLocaleString()}đ
                    </div>

                    <select
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item._id, Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5].map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>

                    <div className="cp-total">
                      {((item.priceAtAddition ?? 0) * item.quantity).toLocaleString()}đ
                    </div>

                    <button className="cp-remove" onClick={() => handleRemove(item._id)}>🗑</button>
                  </div>
                );
              })}
            </div>

            {/* RIGHT */}
            <div className="cp-right">
              <div className="cp-coupon">
                {couponApplied ? (
                  <div className="cp-coupon-applied">
                    <span>🏷️ <strong>{couponApplied.code}</strong> – {couponApplied.name}</span>
                    <button className="cp-coupon-remove" onClick={handleRemoveCoupon}>✕</button>
                  </div>
                ) : (
                  <>
                    <input
                      placeholder="Mã khuyến mãi"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); setCouponMsg(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    />
                    <button onClick={handleApplyCoupon} disabled={applyingCoupon}>
                      {applyingCoupon ? "..." : "Áp dụng"}
                    </button>
                  </>
                )}
              </div>
              {couponMsg && <p style={{ color: "#16a34a", fontSize: 13, marginTop: 4 }}>{couponMsg}</p>}
              {couponError && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 4 }}>{couponError}</p>}

              <div className="cp-summary">
                <h3>Tổng cộng</h3>
                <div className="cp-row"><span>Tổng tiền hàng</span><span>{totalPrice.toLocaleString()}đ</span></div>
                <div className="cp-row"><span>Phí vận chuyển</span><span>Free</span></div>
                <div className="cp-row"><span>Khuyến mãi</span><span>-{discount.toLocaleString()}đ</span></div>
                <hr />
                <div className="cp-row cp-final"><span>Tổng thanh toán</span><span>{finalTotal.toLocaleString()}đ</span></div>
              </div>

              <div className="cp-actions">
                <button className="cp-back" onClick={() => navigate(-1)}>Quay lại</button>
                <button className="cp-checkout" onClick={handleCheckout}>Tiến hành thanh toán</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
