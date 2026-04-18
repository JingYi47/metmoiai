import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  if (!product) return null;

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="img">
        <img src={product.images?.[0]?.url || product.imageUrl} alt={product.name} />
      </div>

      <h3>{product.name}</h3>

      <div className="price">
        <span className="current">{product.price.toLocaleString()}₫</span>
        {product.originalPrice > product.price && (
          <span className="original">{product.originalPrice.toLocaleString()}₫</span>
        )}
      </div>

      <div className="rating">
        <span className="stars">{"★".repeat(Math.round(product.rating))}</span>
        <span>{product.rating} ({product.reviewCount})</span>
      </div>
    </Link>
  );
}
