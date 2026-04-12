export type Category = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  isFeatured?: boolean;
};

export type ProductImage = { url: string; public_id: string };

export type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  brand?: string;
  category?: string | Category;
  featured?: boolean;
  images?: ProductImage[];
};

export type User = {
  _id: string;
  username?: string;
  email: string;
  role: "user" | "admin" | "staff";
  isLocked?: boolean;
};

export type Coupon = {
  _id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
};
