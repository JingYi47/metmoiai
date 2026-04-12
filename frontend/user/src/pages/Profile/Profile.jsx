import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProfileSidebar from "../../components/ProfileSidebar";
import ProfileContent from "../../components/ProfileContent";
import "./Profile.css";

export default function Profile() {
  return (
    <>
      <Header />

      <div className="profile-wrapper">
        <ProfileSidebar />
        <ProfileContent />
      </div>

      <Footer />
    </>
  );
}