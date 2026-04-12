import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  if (!product) return null;

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="img">
        <img src={product.images?.[0]?.url} alt={product.name} />
      </div>

      <h3>{product.name}</h3>

      <p className="price">
        <span>{product.price.toLocaleString()}đ</span>
        <span className="original">{product.originalPrice.toLocaleString()}đ</span>
      </p>

      <div className="rating">
        <span>⭐ {product.rating} ({product.reviewCount})</span>
      </div>
    </Link>
  );
}
