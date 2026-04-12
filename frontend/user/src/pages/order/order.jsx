import Header from "../../components/Header";
import Footer from "../../components/footer";
import OrderSection from "../../components/OrderSection";
import { orderApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import "./order.css";

export default function OrderListPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    orderApi.getMy()
      .then((data) => setOrders(data.orders ?? data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const DONE = ["delivered", "completed", "returned"];
  const CANCELLED = ["cancelled"];
  const pendingOrders = orders.filter((o) => !DONE.includes(o.status) && !CANCELLED.includes(o.status));
  const completedOrders = orders.filter((o) => DONE.includes(o.status));
  const cancelledOrders = orders.filter((o) => CANCELLED.includes(o.status));

  const formatDate = (date) => new Date(date).toLocaleDateString("vi-VN");

  return (
    <>
      <Header />

      <main className="order-page">
        <div className="breadcrumb">
          Trang chủ / <strong>Đơn hàng của tôi</strong>
        </div>

        {!user ? (
          <p style={{ textAlign: "center" }}>Vui lòng <a href="/Login">đăng nhập</a> để xem đơn hàng</p>
        ) : loading ? (
          <p style={{ textAlign: "center" }}>Đang tải...</p>
        ) : (
          <>
            <OrderSection title="ĐANG XỬ LÝ" orders={pendingOrders} formatDate={formatDate} />
            <OrderSection title="ĐÃ HOÀN THÀNH" orders={completedOrders} formatDate={formatDate} />
            {cancelledOrders.length > 0 && (
              <OrderSection title="ĐÃ HỦY" orders={cancelledOrders} formatDate={formatDate} />
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
