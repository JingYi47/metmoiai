const BASE = "http://localhost:8000/api/v1";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra");
  return data;
}

// ── AUTH ──────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    request("/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  loginWithGoogle: (idToken) =>
    request("/user/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),

  register: (email, password, firstName, lastName) =>
    request("/user/register", {
      method: "POST",
      body: JSON.stringify({ email, password, firstName, lastName }),
    }),

  logout: () => request("/user/logout", { method: "POST" }),

  getProfile: () => request("/user/profile"),

  updateProfile: (data) =>
    request("/user/profile", { method: "PUT", body: JSON.stringify(data) }),

  changePassword: (currentPassword, newPassword) =>
    request("/user/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  forgotPassword: (email) =>
    request("/user/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

// ── PRODUCTS ──────────────────────────────────────────
export const productApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? "?" + qs : ""}`);
  },
  getById: (id) => request(`/products/${id}`),
  getBySlug: (slug) => request(`/products/slug/${slug}`),
  getNewArrivals: () => request("/products/new-arrivals"),
  getFeatured: () => request("/products/featured"),
  getOnSale: () => request("/products/on-sale"),
  search: (q) => request(`/products/search?q=${encodeURIComponent(q)}`),
};

// ── CATEGORIES ────────────────────────────────────────
export const categoryApi = {
  getAll: () => request("/categories"),
  getWithCount: () => request("/categories/with-count"),
  getFeatured: () => request("/categories/featured"),
  getBySlug: (slug) => request(`/categories/slug/${encodeURIComponent(slug)}`),
  getProductsBySlug: (slug) => request(`/categories/${slug}/products`),
};

// ── CART ──────────────────────────────────────────────
export const cartApi = {
  get: () => request("/cart"),
  add: (productId, quantity, color) =>
    request("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, color }),
    }),
  updateQuantity: (itemId, quantity) =>
    request(`/cart/quantity/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),
  toggleSelect: (itemId) =>
    request(`/cart/toggle/${itemId}`, { method: "PATCH" }),
  removeItem: (itemId) => request(`/cart/item/${itemId}`, { method: "DELETE" }),
  clear: () => request("/cart/clear", { method: "DELETE" }),
};

// ── WISHLIST ──────────────────────────────────────────
export const wishlistApi = {
  get: () => request("/user/wishlist"),
  add: (productId) =>
    request("/user/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  remove: (productId) =>
    request(`/user/wishlist/${productId}`, { method: "DELETE" }),
};

// ── CHECKOUT ──────────────────────────────────────────
export const checkoutApi = {
  create: (data) =>
    request("/checkout", { method: "POST", body: JSON.stringify(data) }),
  getMy: () => request("/checkout/me"),
  getById: (id) => request(`/checkout/${id}`),
};

// ── COUPONS ───────────────────────────────────────────
export const couponApi = {
  getPublic: () => request("/coupon/public"),
  apply: (code, subtotal) =>
    request("/coupon/apply", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    }),
};

// ── ORDERS ───────────────────────────────────────────
export const orderApi = {
  getMy: () => request("/orders/me"),
  getById: (id) => request(`/orders/${id}`),
  createFromCheckout: (checkoutId) =>
    request(`/orders/from-checkout/${checkoutId}`, { method: "POST" }),
  cancel: (orderId) => request(`/orders/${orderId}/cancel`, { method: "PUT" }),
};

// ── PAYMENT ───────────────────────────────────────────
export const paymentApi = {
  createVnpay: (checkoutId) =>
    request(`/payment/vnpay/create/${checkoutId}`, { method: "POST" }),
  createMomo: (checkoutId) =>
    request(`/payment/momo/create/${checkoutId}`, { method: "POST" }),
  simulateMomo: (checkoutId, success = true) =>
    request("/payment/momo/simulate", {
      method: "POST",
      body: JSON.stringify({ checkoutId, success }),
    }),
};

// ── REVIEWS ───────────────────────────────────────────
export const reviewApi = {
  getByProduct: (productId) => request(`/reviews/product/${productId}`),
  createOrUpdate: (productId, rating, comment) =>
    request("/reviews", {
      method: "POST",
      body: JSON.stringify({ productId, rating, comment }),
    }),
};
/// ── CHATBOT API ───────────────────────────────────────
export const chatApi = {
  // Thêm tham số products vào đây
  sendMessage: (message, products = []) =>
    request("/chat", {
      method: "POST",
      body: JSON.stringify({ message, products }), // Gửi kèm products sang Node.js
    }),

  getHistory: () => request("/chat/history"),
  getAIRecommendations: () => request("/chat/recommendations"),
};

// ── AI SMART SEARCH ───────────────────────────────────
export const aiApi = {
  smartSearch: (q, limit = 5) =>
    request(`/ai/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  smartSearchDify: (q) =>
    request(`/ai/dify-smart-search?q=${encodeURIComponent(q)}`),
  visualSearch: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return fetch(`${BASE}/ai/visual-search`, {
      method: "POST",
      headers: {
        Authorization: getToken() ? `Bearer ${getToken()}` : "",
      },
      body: formData,
    }).then((res) => res.json());
  },
  visualSearchByUrl: (imageUrl) => {
    return fetch(`${BASE}/ai/visual-search`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: getToken() ? `Bearer ${getToken()}` : "",
       },
       body: JSON.stringify({ image_url: imageUrl })
    }).then((res) => res.json());
  },
  getTrendingSearches: () => request("/ai/trending"),
  getStatus: () => request("/ai/status"),
};
