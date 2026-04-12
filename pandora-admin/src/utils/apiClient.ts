const BASE = "http://localhost:8000/api/v1";

export function getAuthToken(): string | null {
  return localStorage.getItem("admin_token_v1");
}

async function request<T = any>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token && !options.skipAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error((data as any).message || "Có lỗi xảy ra");
  return data as T;
}

// ── AUTH ──────────────────────────────────────────────
export const adminAuthApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),
};

// ── PRODUCTS ──────────────────────────────────────────
export const adminProductApi = {
  getAll: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ products: any[]; total?: number }>(`/products${qs ? "?" + qs : ""}`);
  },
  getById: (id: string) => request<any>(`/products/${id}`),
  create: (data: FormData | Record<string, any>) => {
    if (data instanceof FormData) {
      return fetch(`${BASE}/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` },
        body: data,
      }).then((r) => r.json());
    }
    return request<any>("/products", { method: "POST", body: JSON.stringify(data) });
  },
  update: (id: string, data: Record<string, any>) =>
    request<any>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/products/${id}`, { method: "DELETE" }),
  hide: (id: string) => request<any>(`/products/${id}/disable`, { method: "PUT" }),
  show: (id: string) => request<any>(`/products/${id}/enable`, { method: "PUT" }),
  addImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return fetch(`${BASE}/products/${id}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` },
      body: fd,
    }).then((r) => r.json());
  },
  addColorImage: (id: string, colorName: string, file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return fetch(`${BASE}/products/${id}/color/${encodeURIComponent(colorName)}/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` },
      body: fd,
    }).then((r) => r.json());
  },
  deleteImage: (id: string, publicId: string) =>
    request<any>(`/products/${id}/images`, {
      method: "DELETE",
      body: JSON.stringify({ public_id: publicId }),
    }),
  deleteColorImage: (id: string, colorName: string, publicId: string) =>
    request<any>(`/products/${id}/color/${encodeURIComponent(colorName)}/image`, {
      method: "DELETE",
      body: JSON.stringify({ public_id: publicId }),
    }),
};

// ── CATEGORIES ────────────────────────────────────────
export const adminCategoryApi = {
  getAll: () => request<any>("/categories/with-count"),
  getById: (id: string) => request<any>(`/categories/${id}`),
  getProductsBySlug: (slug: string) => request<any>(`/categories/${slug}/products`),
  create: (data: { name: string; description?: string; imageFile?: File | null }) => {
    if (data.imageFile instanceof File) {
      const fd = new FormData();
      fd.append("name", data.name);
      if (data.description) fd.append("description", data.description);
      fd.append("image", data.imageFile);
      return fetch(`${BASE}/categories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` },
        body: fd,
      }).then((r) => r.json());
    }
    return request<any>("/categories", { method: "POST", body: JSON.stringify({ name: data.name, description: data.description }) });
  },
  update: (id: string, data: Record<string, any> & { imageFile?: File | null }) => {
    if (data.imageFile instanceof File) {
      const fd = new FormData();
      if (typeof data.name === "string") fd.append("name", data.name);
      if (typeof data.description === "string") fd.append("description", data.description);
      fd.append("image", data.imageFile);
      return fetch(`${BASE}/categories/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` },
        body: fd,
      }).then((r) => r.json());
    }
    return request<any>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  delete: (id: string) => request<any>(`/categories/${id}`, { method: "DELETE" }),
};

// ── ORDERS / CHECKOUT ─────────────────────────────────
export const adminOrderApi = {
  getAll: () =>
    request<any>("/checkout/admin/all").then((res: any) =>
      res?.checkouts ?? res ?? []
    ),
  updateStatus: (id: string, status: string) =>
    request<any>(`/checkout/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
};

// ── USERS ─────────────────────────────────────────────
export const adminUsersApi = {
  getAll: () => request<any[]>("/admin/users"),
  getById: (id: string) => request<any>(`/admin/users/${id}`),
  delete: (id: string) => request<any>(`/admin/users/${id}/delete`, { method: "DELETE" }),
  updateRole: (id: string, role: string) =>
    request<any>(`/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  lock: (id: string) => request<any>(`/admin/users/${id}/lock`, { method: "PUT" }),
  unlock: (id: string) => request<any>(`/admin/users/${id}/unlock`, { method: "PUT" }),
};

// ── COUPONS ───────────────────────────────────────────
export const adminCouponApi = {
  getAll: () => request<any[]>("/coupon"),
  create: (data: Record<string, any>) =>
    request<any>("/coupon", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, any>) =>
    request<any>(`/coupon/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/coupon/${id}`, { method: "DELETE" }),
};
// ── REAL ORDERS ───────────────────────────────────────────
export const adminRealOrderApi = {
  getAll: () => request<any>("/orders"),
  getById: (id: string) => request<any>(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    request<any>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updatePaymentStatus: (id: string, paymentStatus: string) =>
    request<any>(`/orders/${id}/payment-status`, {
      method: "PUT",
      body: JSON.stringify({ paymentStatus }),
    }),
};

// ── REVIEWS ───────────────────────────────────────────────
export const adminReviewApi = {
  getAll: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/reviews${qs ? "?" + qs : ""}`);
  },
  delete: (id: string) => request<any>(`/reviews/${id}`, { method: "DELETE" }),
};