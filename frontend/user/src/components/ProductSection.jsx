import ProductCard from "./ProductCard";
import { useNavigate } from "react-router-dom";

export default function ProductSection({ title, products, showHeader = true, viewAllPath, loadMorePath }) {
  const navigate = useNavigate();

  return (
    <section className="product-section">
      {showHeader && (
        <div className="section-header">
          <h2>{title}</h2>
          {viewAllPath ? (
            <button className="view-all" onClick={() => navigate(viewAllPath)}>
              Xem tất cả
            </button>
          ) : (
            <span />
          )}
        </div>
      )}

      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {loadMorePath ? (
        <button className="load-more" onClick={() => navigate(loadMorePath)}>
          Xem tất cả sản phẩm
        </button>
      ) : null}
    </section>
  );
}
