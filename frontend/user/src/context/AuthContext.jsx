import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục session từ localStorage khi load trang
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    const { token, user: u } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const loginWithGoogle = async (idToken) => {
    const data = await authApi.loginWithGoogle(idToken);
    const { token, user: u } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (email, password, firstName, lastName) => {
    return authApi.register(email, password, firstName, lastName);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (updated) => {
    const next = { ...user, ...updated };
    localStorage.setItem("user", JSON.stringify(next));
    setUser(next);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
