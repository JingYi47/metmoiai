import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/home/homePage";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ProductDetailPage from "../pages/product details/product_details";
import IphonePage from "../pages/Iphone/Iphone";
import Laptop from "../pages/laptop/laptop";
import MiniSpeaker from "../pages/miniSpeaker/miniSpeaker";
import Headphones from "../pages/headphones/headphones";
import Ipad from "../pages/ipad/ipad";
import Payment from "../pages/payment/payment";
import CheckoutPage from "../pages/checkout/checkout";
import CheckOrderPage from "../pages/checkout_Order/checkOrder";
import Order from "../pages/order/order";
import CartPage from "../pages/CartPage/CartPage";
import FavoritePage from "../pages/FavoritePage/FavoritePage.jsx";
import Profile from "../pages/Profile/Profile.jsx"
import AddressManagement from "../pages/AddressManagement/AddressManagement.jsx"
import PaymentManagement from "../pages/PaymentManagement/PaymentManagement.jsx"
import VerifyEmail from "../pages/VerifyEmail/VerifyEmail.jsx"
import OrderDetail from "../pages/OrderDetail/OrderDetail.jsx"
import PaymentSuccess from "../pages/PaymentResult/PaymentSuccess.jsx"
import PaymentFail from "../pages/PaymentResult/PaymentFail.jsx"
import SearchPage from "../pages/search/search.jsx"
import ProductsPage from "../pages/products/products.jsx"
function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/Login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/iphone" element={<IphonePage />} />
        <Route path="/laptop" element={<Laptop />} />
        <Route path="/speaker" element={<MiniSpeaker />} />
        <Route path="/headphones" element={<Headphones />} />
        <Route path="/ipad" element={<Ipad />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/Payment" element={<Payment />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkorder" element={<CheckOrderPage />} />
        <Route path="/Order" element={<Order />} />
        <Route path="/order/:id" element={<OrderDetail />} />
        <Route path="/payment-success/:checkoutId" element={<PaymentSuccess />} />
        <Route path="/payment-fail" element={<PaymentFail />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/favorites" element={<FavoritePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/orders/:status" element={<Profile />} />
        <Route path="/profile/wishlist" element={<FavoritePage />} />
        <Route path="/profile/address" element={<AddressManagement />} />
        <Route path="/profile/payment" element={<PaymentManagement />} />
        <Route path="/xac-thuc-email" element={<VerifyEmail />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
