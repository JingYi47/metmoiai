export default function ShippingAddress({ shippingAddress, onChange, editable = false }) {
  if (!shippingAddress) return null;

  const { fullName, phone, address, ward, district, province } = shippingAddress;

  if (editable && onChange) {
    return (
      <div className="sa-grid">
        <div className="sa-field">
          <label>Họ và tên *</label>
          <input
            placeholder="Nguyễn Văn A"
            value={fullName ?? ""}
            onChange={(e) => onChange({ ...shippingAddress, fullName: e.target.value })}
          />
        </div>
        <div className="sa-field">
          <label>Số điện thoại *</label>
          <input
            placeholder="09xxxxxxxx"
            value={phone ?? ""}
            onChange={(e) => onChange({ ...shippingAddress, phone: e.target.value })}
          />
        </div>
        <div className="sa-field sa-full">
          <label>Địa chỉ (số nhà, tên đường) *</label>
          <input
            placeholder="123 Đường ABC, Phường X"
            value={address ?? ""}
            onChange={(e) => onChange({ ...shippingAddress, address: e.target.value })}
          />
        </div>
        <div className="sa-field">
          <label>Quận / Huyện</label>
          <input
            placeholder="Quận 1"
            value={district ?? ""}
            onChange={(e) => onChange({ ...shippingAddress, district: e.target.value })}
          />
        </div>
        <div className="sa-field">
          <label>Tỉnh / Thành phố</label>
          <input
            placeholder="Hà Nội"
            value={province ?? ""}
            onChange={(e) => onChange({ ...shippingAddress, province: e.target.value })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="address-view">
      <p><strong>{fullName}</strong> &nbsp;|&nbsp; 📞 {phone}</p>
      <p>📍 {[address, district, province].filter(Boolean).join(", ")}</p>
    </div>
  );
}
