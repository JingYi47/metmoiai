const METHODS = [
  { value: "COD",    label: "Thanh toán khi nhận hàng (COD)", icon: "💰" },
  { value: "VNPAY",  label: "VNPay",         icon: "💳" },
  { value: "MOMO",   label: "Ví MoMo",        icon: "💜" },
  { value: "BANKING",label: "Chuyển khoản ngân hàng", icon: "🏦" },
];

export default function PaymentMethod({ paymentMethod, setPaymentMethod }) {
  return (
    <div className="pm-box">
      <h3 style={{ marginBottom: 12 }}>Phương thức thanh toán</h3>
      {METHODS.map((m) => (
        <label
          key={m.value}
          className={`pm-option ${paymentMethod === m.value ? "selected" : ""}`}
          onClick={() => setPaymentMethod(m.value)}
        >
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === m.value}
            onChange={() => setPaymentMethod(m.value)}
          />
          <span className="pm-icon">{m.icon}</span>
          <span>{m.label}</span>
        </label>
      ))}
    </div>
  );
}
