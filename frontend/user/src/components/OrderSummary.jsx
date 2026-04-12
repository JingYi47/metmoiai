export default function OrderSummary({ items, subtotal, shippingFee, discount, total }) {
  return (
    <>
      <div className="checkout-items">
        {items.map((item, index) => {
          const imgUrl = item.image || item.images?.[0]?.url || "";
          return (
            <div className="checkout-item" key={index}>
              <div className="item-info">
                {imgUrl
                  ? <img src={imgUrl} alt={item.name} />
                  : <div className="item-img-placeholder">📱</div>
                }
                <div>
                  <p className="item-name">{item.name}</p>
                  <p className="item-meta">
                    {item.color && `Màu: ${item.color} · `}x{item.quantity} × {(item.price ?? 0).toLocaleString()}đ
                  </p>
                </div>
              </div>
              <span className="item-price">
                {(item.total ?? (item.price * item.quantity) ?? 0).toLocaleString()}đ
              </span>
            </div>
          );
        })}
      </div>

      <div className="summary">
        <div className="row"><span>Tổng tiền hàng</span><span>{(subtotal ?? 0).toLocaleString()}đ</span></div>
        <div className="row">
          <span>Phí vận chuyển</span>
          <span>{shippingFee === 0 ? "Miễn phí" : `${(shippingFee ?? 0).toLocaleString()}đ`}</span>
        </div>
        {discount > 0 && (
          <div className="row"><span>Khuyến mãi</span><span style={{ color: "#16a34a" }}>-{(discount ?? 0).toLocaleString()}đ</span></div>
        )}
        <div className="row total"><span>Tổng thanh toán</span><span>{(total ?? 0).toLocaleString()}đ</span></div>
      </div>
    </>
  );
}
