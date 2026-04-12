import iphone from "../assets/iphone1.jpg";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-left">
        <p className="sub">Bộ sưu tập iPhone</p>
        <h1>Ưu đãi đặc biệt lên tới 20%</h1>
        <button className="buy">Mua ngay →</button>
      </div>

      <div className="hero-right">
        <img src={iphone} alt="iphone" />
      </div>
    </section>
  );
}
