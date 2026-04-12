import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineHeart } from "react-icons/ai";
import { FiShoppingCart, FiUser, FiSearch, FiCamera } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { aiApi } from "../services/api";
import "./Header.css";

export default function Header() {
  const [openProduct, setOpenProduct] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [trending, setTrending] = useState([]);
  const searchContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const suggestionCache = useRef({}); // Cache for instant results

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Load trending searches on mount
    aiApi.getTrendingSearches().then(res => {
      if (res.success) setTrending(res.trending || []);
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/Login");
  };

  const goTo = (path) => {
    navigate(path);
    setOpenProduct(false);
    setOpenUser(false);
    setShowDropdown(false);
  };

  const goSearch = (query) => {
    const q = (query || searchValue).trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setShowDropdown(false);
    setOpenProduct(false);
    setOpenUser(false);
  };

  const handleImageSearch = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Chuyển hướng sang trang search với flag tìm bằng hình ảnh
    // Chúng ta truyền file qua state của React Router
    navigate("/search", { 
      state: { 
        visualFile: file,
        visualSearchMode: true 
      } 
    });
  };

  // Debounced smart search
  useEffect(() => {
    const q = searchValue.trim();
    if (!q) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // 1. Check Cache first for instant response
    if (suggestionCache.current[q]) {
      setSuggestions(suggestionCache.current[q]);
      setShowDropdown(true);
      return;
    }

    const timer = setTimeout(async () => {
      if (q.length >= 1) { 
        setIsSearching(true);
        try {
          const res = await aiApi.smartSearch(q, 10); 
          if (res.success) {
            const results = res.results || [];
            setSuggestions(results);
            suggestionCache.current[q] = results; // Save to cache
            setShowDropdown(true);
          }
        } catch (err) {
          console.error("Lỗi tìm kiếm gợi ý:", err);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }
    }, 200); // Reduced to 200ms for high sensitivity
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <header className="header">
      <div className="header-container">
        {/* LOGO */}
        <div className="logo" onClick={() => goTo("/")}>
          <span className="logo-text">Pandora</span>
          <span className="logo-pro">Pro</span>
        </div>

        {/* MENU */}
        <nav className="menu">
          <div className="menu-item" onClick={() => goTo("/")}>
            <span>Trang Chủ</span>
          </div>

          <div className="menu-item">
            <span>Giới Thiệu</span>
          </div>

          {/* DROPDOWN SẢN PHẨM */}
          <div className="menu-item dropdown-parent">
            <span onClick={() => setOpenProduct(!openProduct)}>Sản Phẩm</span>
            <button
              className="dropdown-btn"
              onClick={() => setOpenProduct(!openProduct)}
            >
              <span>▼</span>
            </button>

            {openProduct && (
              <div className="dropdown">
                <p onClick={() => goTo("/iphone")}>iPhone</p>
                <p onClick={() => goTo("/laptop")}>Laptop</p>
                <p onClick={() => goTo("/speaker")}>Mini Speakers</p>
                <p onClick={() => goTo("/headphones")}>Headphones</p>
                <p onClick={() => goTo("/ipad")}>iPad</p>
              </div>
            )}
          </div>

          <div className="menu-item">
            <span>Liên hệ</span>
          </div>
        </nav>

        {/* ACTIONS */}
        <div className="header-actions">

          {/* SMART SEARCH */}
          {/* SMART SEARCH REDESIGNED */}
          <div className="search-container" ref={searchContainerRef}>
            <div className="search-box">
              <div className="search-inner">
                <input
                  className="search-input"
                  placeholder="Khám phá ngay sản phẩm mới..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goSearch();
                  }}
                  onFocus={() => {
                    if (searchValue.length >= 1) setShowDropdown(true);
                  }}
                />
                <div className="search-extras">
                  {isSearching ? (
                    <div className="search-loader" />
                  ) : (
                    <FiCamera
                      className="camera-icon-btn"
                      title="Tìm bằng hình ảnh"
                      onClick={() => fileInputRef.current?.click()}
                    />
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleImageSearch}
                  />
                </div>
              </div>
              <button className="search-button" onClick={() => goSearch()}>
                <FiSearch />
                <span>Tìm kiếm</span>
              </button>
            </div>

            {showDropdown && (
              <div className="search-results-dropdown">
                {searchValue.trim() === "" ? (
                  <div className="suggestion-container">
                    <div className="suggestion-label">Tìm kiếm phổ biến</div>
                    <div className="trending-tags">
                      {trending.map((item, idx) => (
                        <div
                          key={idx}
                          className="trending-tag"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchValue(item);
                            goSearch(item);
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="suggestion-container">
                    <div className="suggestion-label">Kết quả gợi ý</div>
                    <div className="suggestion-list">
                      {suggestions.slice(0, 8).map((item) => (
                        <div
                          key={item._id || item.slug}
                          className="suggestion-result-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            goSearch(item.name);
                          }}
                        >
                          <FiSearch className="res-icon" />
                          <span className="res-name">{item.name}</span>
                        </div>
                      ))}
                    </div>
                    <div
                      className="view-all-link"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        goSearch();
                      }}
                    >
                      Kết quả cuối cùng cho &ldquo;{searchValue}&rdquo;
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* ICONS */}
          <div
            className="favorite-icon"
            onClick={() => navigate("/favorites")}
            style={{ cursor: "pointer" }}
          >
            <AiOutlineHeart />
          </div>

          <div
            className="cart-icon"
            onClick={() => navigate("/cart")}
            style={{ cursor: "pointer" }}
          >
            <FiShoppingCart />
          </div>

          {/* AUTH */}
          {!user ? (
            <button
              className="header-login-btn"
              onClick={() => navigate("/login")}
            >
              <span>Đăng nhập</span>
            </button>
          ) : (
            <div className="user-dropdown">
              <button
                className="user-avatar"
                onClick={() => setOpenUser(!openUser)}
              >
                <FiUser className="user-icon" />
              </button>

              {openUser && (
                <div className="user-menu">
                  <div onClick={() => goTo("/profile")}><span>Thông tin tài khoản</span></div>
                  <div onClick={() => goTo("/order")}><span>Đơn hàng của tôi</span></div>
                  <div><span>Đánh giá</span></div>
                  <div className="logout" onClick={handleLogout}>
                    <span>Đăng xuất</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
