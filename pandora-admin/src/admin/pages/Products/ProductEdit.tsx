import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminProductApi } from "../../../utils/apiClient";
import { ProductForm } from "./ProductForm";

export default function ProductEdit() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminProductApi.getById(id)
      .then((data) => setProduct(data.product ?? data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40 }}>Đang tải...</div>;
  return <ProductForm mode="edit" product={product} />;
}
