import React from "react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="card card-pad">
      <h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>
      <p style={{ color: "#6b7280" }}>(Mock) Trang này chưa được triển khai trong bản demo frontend-only.</p>
    </div>
  );
}
