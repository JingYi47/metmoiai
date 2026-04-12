import { useNavigate } from "react-router-dom";

export default function OrderSection({ title, orders, formatDate }) {
  const navigate = useNavigate();

  const goToCheckout = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  return (
    <div className="order-section">
      <div className="section-header">
        <h3>{title}</h3>
        {title === "ĐANG GIAO" && (
          <button className="shop-btn">Shop Now</button>
        )}
      </div>

      <table className="order-table">
        <thead>
          <tr>
            <th>Mã đơn hàng</th>
            <th>Phí vận chuyển</th>
            <th>Ngày đặt</th>
            <th>Giá</th>
            <th>Trạng thái</th>
            <th>Chi tiết</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order._id}</td>
              <td>{order.shippingFee === 0 ? "free" : order.shippingFee}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>{order.total.toLocaleString()}đ</td>
              <td>
                <span className={`status ${order.status}`}>
                  {order.status === "pending" ? "Pending" : "Completed"}
                </span>
              </td>
              <td>
                <button
                  className="detail-btn"
                  onClick={() => goToCheckout(order._id)}
                >
                  Xem
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
