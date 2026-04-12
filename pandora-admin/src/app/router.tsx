import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { RequireAdmin } from "../auth/RequireAdmin";
import { AdminLayout } from "../admin/layout/AdminLayout";

import Login from "../admin/pages/Login";
import Dashboard from "../admin/pages/Dashboard/index";
import Orders from "../admin/pages/Orders/index";
import OrderDetail from "../admin/pages/Orders/OrderDetail";

import ProductList from "../admin/pages/Products/ProductList";
import ProductCreate from "../admin/pages/Products/ProductCreate";
import ProductEdit from "../admin/pages/Products/ProductEdit";

import Categories from "../admin/pages/Categories/index";
import CategoryCreate from "../admin/pages/Categories/CategoryCreate";
import CategoryEdit from "../admin/pages/Categories/CategoryEdit";

import Users from "../admin/pages/Users/index";
import Coupons from "../admin/pages/Coupons/index";
import Reports from "../admin/pages/Reports/index";
import Inbox from "../admin/pages/Inbox/index";
import Support from "../admin/pages/Support/index";
import Settings from "../admin/pages/Settings/index";
import Reviews from "../admin/pages/Reviews/index";
import Placeholder from "../admin/pages/Placeholder";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Dashboard /> },

      { path: "orders", element: <Orders /> },
      { path: "orders/:id", element: <OrderDetail /> },

      { path: "products", element: <ProductList /> },
      { path: "products/new", element: <ProductCreate /> },
      { path: "products/:id/edit", element: <ProductEdit /> },

      { path: "categories", element: <Categories /> },
      { path: "categories/new", element: <CategoryCreate /> },
      { path: "categories/:id/edit", element: <CategoryEdit /> },

      { path: "users", element: <Users /> },
      { path: "coupons", element: <Coupons /> },
      { path: "reports", element: <Reports /> },
      { path: "inbox", element: <Inbox /> },
      { path: "support", element: <Support /> },
      { path: "settings", element: <Settings /> },
      { path: "reviews", element: <Reviews /> },
    ],
  },
]);
