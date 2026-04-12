import React from "react";

export function BrandLogo() {
  return (
    <div className="brand">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M32 6c14.36 0 26 11.64 26 26S46.36 58 32 58 6 46.36 6 32 17.64 6 32 6Z" stroke="#2F92F2" strokeWidth="3" opacity="0.25"/>
        <path d="M20 24c3-7 10-12 18-12" stroke="#2F92F2" strokeWidth="3" strokeLinecap="round"/>
        <path d="M44 40c-3 7-10 12-18 12" stroke="#2F92F2" strokeWidth="3" strokeLinecap="round"/>
        <path d="M22 42a14 14 0 0 1 0-20" stroke="#2F92F2" strokeWidth="3" strokeLinecap="round"/>
        <path d="M42 22a14 14 0 0 1 0 20" stroke="#2F92F2" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <div className="brand-name">
        Pandora<span>Pro</span>
      </div>
    </div>
  );
}
