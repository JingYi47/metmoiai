import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProfileSidebar from "../../components/ProfileSidebar";
import ProfileContent from "../../components/ProfileContent";


export default function PaymentManagement() {
  return (
    <>
      <Header />

      <div className="profile-wrapper">
        <ProfileSidebar />
        <ProfileContent title="Phương thức thanh toán" />
      </div>

      <Footer />
    </>
  );
}