import { v4 as uuid } from "uuid";
import type { Category, Product } from "../../types";

export type OrderStatus = "Ready" | "Shipped" | "Received";
export type PaymentStatus = "Paid" | "Pending";

export type Order = {
  id: string;
  code: string;
  placedAt: string; // ISO
  customer: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  total: number; // VND
};

export type DashboardTxn = {
  id: string;
  name: string;
  date: string; // dd.mm.yyyy
  amount: number;
  status: PaymentStatus;
};

export type DashboardTopProduct = {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
};

export type MockDB = {
  categories: Category[];
  products: (Product & { color?: string; rating?: number; ratingCount?: number; imageUrl?: string; inStockText?: string })[];
  orders: Order[];
  dashboardTxns: DashboardTxn[];
  dashboardTopProducts: DashboardTopProduct[];
};

const KEY = "pandora_mock_db_v1";

function seed(): MockDB {
  const categories: Category[] = [
    { _id: uuid(), name: "Iphone", slug: "iphone" },
    { _id: uuid(), name: "Tivi", slug: "tivi" },
    { _id: uuid(), name: "Ipad", slug: "ipad" },
    { _id: uuid(), name: "HeadPhones", slug: "headphones" },
    { _id: uuid(), name: "MiniSpeaker", slug: "minispeaker" },
  ];

  const products: MockDB["products"] = [
    {
      _id: uuid(),
      name: "Iphone 13 Pro",
      stock: 96,
      price: 21990000,
      color: "Xanh Dương",
      rating: 5.0,
      ratingCount: 32,
      imageUrl: "https://images.unsplash.com/photo-1603899122576-32d7f6d3f404?auto=format&fit=crop&w=120&q=60",
      category: categories[0],
    },
    {
      _id: uuid(),
      name: "Iphone 14",
      stock: 56,
      price: 11020000,
      color: "Hồng",
      rating: 4.8,
      ratingCount: 24,
      imageUrl: "https://images.unsplash.com/photo-1661961110449-f053b3b0a219?auto=format&fit=crop&w=120&q=60",
      category: categories[0],
    },
    {
      _id: uuid(),
      name: "Iphone 14",
      stock: 78,
      price: 11020000,
      color: "Xanh Dương",
      rating: 5.0,
      ratingCount: 54,
      imageUrl: "https://images.unsplash.com/photo-1605236453806-a0d45c90e15d?auto=format&fit=crop&w=120&q=60",
      category: categories[0],
    },
    {
      _id: uuid(),
      name: "Tai nghe AirPad Pro 2",
      stock: 32,
      price: 4990000,
      color: "Trắng",
      rating: 4.5,
      ratingCount: 31,
      imageUrl: "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=120&q=60",
      category: categories[3],
    },
    {
      _id: uuid(),
      name: "Macbook Air 13 M4 2025",
      stock: 32,
      price: 23990000,
      color: "Bạc",
      rating: 4.9,
      ratingCount: 22,
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=120&q=60",
      category: categories[2],
    },
    {
      _id: uuid(),
      name: "Tai nghe AirPad Pro 2",
      stock: 96,
      price: 4990000,
      color: "Đen",
      rating: 5.0,
      ratingCount: 32,
      imageUrl: "https://images.unsplash.com/photo-1590658165737-15a047b0bfe1?auto=format&fit=crop&w=120&q=60",
      category: categories[3],
    },
    {
      _id: uuid(),
      name: "Macbook Air 13 M4 2025",
      stock: 56,
      price: 23990000,
      color: "Xám",
      rating: 4.8,
      ratingCount: 24,
      imageUrl: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=120&q=60",
      category: categories[2],
    },
    {
      _id: uuid(),
      name: "Iphone 13 Pro",
      stock: 0,
      inStockText: "Hết hàng",
      price: 21990000,
      color: "Đen",
      rating: 5.0,
      ratingCount: 54,
      imageUrl: "https://images.unsplash.com/photo-1605236453806-a0d45c90e15d?auto=format&fit=crop&w=120&q=60",
      category: categories[0],
    },
    {
      _id: uuid(),
      name: "Macbook Air 13 M4 2025",
      stock: 0,
      inStockText: "Hết hàng",
      price: 23990000,
      color: "không",
      rating: 4.5,
      ratingCount: 31,
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=120&q=60",
      category: categories[2],
    },
    {
      _id: uuid(),
      name: "Iphone 14",
      stock: 0,
      inStockText: "Hết hàng",
      price: 11020000,
      color: "Trắng",
      rating: 4.9,
      ratingCount: 22,
      imageUrl: "https://images.unsplash.com/photo-1661961110449-f053b3b0a219?auto=format&fit=crop&w=120&q=60",
      category: categories[0],
    },
  ];

  const orders: Order[] = [
    { id: uuid(), code: "BKT0000001", placedAt: "2025-05-05T16:20:00", customer: "Tom Anderson", paymentStatus: "Paid", status: "Ready", total: 115000 },
    { id: uuid(), code: "BKT0000002", placedAt: "2025-05-05T16:15:00", customer: "Jayden Walker", paymentStatus: "Paid", status: "Ready", total: 75000 },
    { id: uuid(), code: "BKT0000003", placedAt: "2025-05-05T16:15:00", customer: "Inez Kim", paymentStatus: "Paid", status: "Ready", total: 22000 },
    { id: uuid(), code: "#23534D", placedAt: "2025-05-05T16:12:00", customer: "Francisco Henry", paymentStatus: "Paid", status: "Shipped", total: 75000 },
    { id: uuid(), code: "#51323C", placedAt: "2025-05-05T16:12:00", customer: "Violet Phillips", paymentStatus: "Paid", status: "Shipped", total: 75000 },
    { id: uuid(), code: "#35622A", placedAt: "2025-05-05T16:12:00", customer: "Rosetta Becker", paymentStatus: "Paid", status: "Shipped", total: 75000 },
    { id: uuid(), code: "#34232D", placedAt: "2025-05-05T16:10:00", customer: "Dean Love", paymentStatus: "Paid", status: "Ready", total: 75000 },
    { id: uuid(), code: "#56212D", placedAt: "2025-05-05T16:08:00", customer: "Nettie Tyler", paymentStatus: "Paid", status: "Ready", total: 75000 },
    { id: uuid(), code: "#76543E", placedAt: "2025-05-05T16:08:00", customer: "Lora Weaver", paymentStatus: "Paid", status: "Shipped", total: 75000 },
    { id: uuid(), code: "#12512B", placedAt: "2025-05-05T16:05:00", customer: "Vincent Cannon", paymentStatus: "Paid", status: "Shipped", total: 75000 },
    { id: uuid(), code: "#12523C", placedAt: "2025-05-05T16:05:00", customer: "Nettie Palmer", paymentStatus: "Paid", status: "Received", total: 75000 },
    { id: uuid(), code: "#23534D", placedAt: "2025-05-05T16:04:00", customer: "Miguel Harris", paymentStatus: "Pending", status: "Ready", total: 75000 },
    { id: uuid(), code: "#12523C", placedAt: "2025-05-05T16:04:00", customer: "Angel Conner", paymentStatus: "Pending", status: "Ready", total: 75000 },
    { id: uuid(), code: "#51322A", placedAt: "2025-05-05T16:03:00", customer: "Rosalie Singleton", paymentStatus: "Pending", status: "Received", total: 75000 },
  ];

  const dashboardTxns: DashboardTxn[] = [
    { id: uuid(), name: "Jagarnath S.", date: "03.10.2025", amount: 123000, status: "Paid" },
    { id: uuid(), name: "Anand G.", date: "02.10.2025", amount: 75000, status: "Pending" },
    { id: uuid(), name: "Kartik S.", date: "02.10.2025", amount: 231000, status: "Paid" },
    { id: uuid(), name: "Rakesh S.", date: "02.10.2025", amount: 115000, status: "Pending" },
    { id: uuid(), name: "Anup S.", date: "02.10.2025", amount: 22000, status: "Paid" },
  ];

  const dashboardTopProducts: DashboardTopProduct[] = [
    { id: uuid(), name: "Đắc nhân tâm", price: 75000, qty: 204, imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=80&q=60" },
    { id: uuid(), name: "Đắc nhân tâm", price: 75000, qty: 155, imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=80&q=60" },
    { id: uuid(), name: "Đắc nhân tâm", price: 75000, qty: 120, imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=80&q=60" },
    { id: uuid(), name: "Đắc nhân tâm", price: 75000, qty: 204, imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=80&q=60" },
    { id: uuid(), name: "Đắc nhân tâm", price: 75000, qty: 155, imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=80&q=60" },
  ];

  return {
    categories,
    products,
    orders,
    dashboardTxns,
    dashboardTopProducts,
  };
}

export function getDb(): MockDB {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const s = seed();
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  try {
    return JSON.parse(raw) as MockDB;
  } catch {
    const s = seed();
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
}

export function setDb(next: MockDB) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function updateDb(mutator: (db: MockDB) => MockDB) {
  const current = getDb();
  setDb(mutator(current));
}

export function currencyVND(v: number) {
  // Keep the same format as the design (dot separators + ₫)
  const s = Math.round(v).toString();
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3);
    parts.unshift(s.substring(start, i));
  }
  return `${parts.join(".")} ₫`;
}
