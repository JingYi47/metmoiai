export default function CheckoutActions({ navigate, handleOrder }) {
  return (
    <div className="checkout-actions">
      <button className="btn-back" onClick={() => navigate(-1)}>
        Quay lại
      </button>
      <button className="btn-submit" onClick={handleOrder}>
        Đặt hàng
      </button>
    </div>
  );
}
