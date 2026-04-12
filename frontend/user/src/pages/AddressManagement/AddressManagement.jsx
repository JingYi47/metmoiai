import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProfileSidebar from "../../components/ProfileSidebar";
import ProfileContent from "../../components/ProfileContent";

export default function AddressManagement() {
  return (
    <>
      <Header />

      <div className="profile-wrapper">
        <ProfileSidebar />
        <ProfileContent title="Quản lý địa chỉ" />
      </div>

      <Footer />
    </>
  );
}
