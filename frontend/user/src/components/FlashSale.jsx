export default function FlashSale() {
  return (
    <section className="flash-sale">
      <div className="flash-left">
        <span className="today">Today's</span>
        <h2>Flash Sales</h2>
      </div>

      <div className="flash-timer">
        {[
          ["Days", "03"],
          ["Hours", "23"],
          ["Minutes", "19"],
          ["Seconds", "56"],
        ].map(([label, value], i) => (
          <div key={i} className="time-box">
            <p>{label}</p>
            <h3>{value}</h3>
          </div>
        ))}
      </div>

      <div className="flash-nav">
        <button>{"<"}</button>
        <button>{">"}</button>
      </div>
    </section>
  );
}
