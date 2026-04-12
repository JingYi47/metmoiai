import iphone from "../assets/iphone.png";
import speaker from "../assets/speaker.png";
import ipad from "../assets/ipad.png";
import headphones from "../assets/headphones.png";
import laptop from "../assets/laptop.png";

export default function Categories() {
  return (
    <section className="categories">
      <h2>Danh mục phổ biến</h2>

      <div className="category-list">
        {[iphone, speaker, ipad, headphones, laptop].map((img, i) => (
          <div className="category" key={i}>
            <img src={img} alt="category" />
          </div>
        ))}
      </div>
    </section>
  );
}
