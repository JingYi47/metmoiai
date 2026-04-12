import { NavLink } from "react-router-dom";

export default function ProfileSidebar() {
  return (
    <div className="profile-sidebar">
      <h4>Quản lý tài khoản</h4>
      <ul>
        <li>
          <NavLink to="/profile" end>
            Hồ sơ của tôi
          </NavLink>
        </li>
      </ul>

      <h4>Đơn hàng</h4>
      <ul>
        <li>
          <NavLink to="/profile/orders/delivered">
            Đã giao
          </NavLink>
        </li>

        <li>
          <NavLink to="/profile/orders/cancelled">
            Đã hủy
          </NavLink>
        </li>
      </ul>

      <h4>
        <NavLink to="/profile/wishlist">
          Danh sách yêu thích
        </NavLink>
      </h4>
    </div>
  );
}