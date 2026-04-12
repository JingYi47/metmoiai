import { Navigate } from "react-router-dom";
import { getToken } from "../utils/storage";
import { useAuthStore } from "./auth.store";

export function RequireAdmin({ children }: { children: JSX.Element }) {
  const token = getToken();
  const user = useAuthStore((s) => s.user);

  if (!token) return <Navigate to="/login" replace />;

  if (user && user.role !== "admin" && user.role !== "staff") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
