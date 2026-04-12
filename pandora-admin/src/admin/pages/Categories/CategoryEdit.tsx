import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminCategoryApi } from "../../../utils/apiClient";
import { CategoryEditor } from "./CategoryEditor";

export default function CategoryEdit() {
  const { id } = useParams();
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminCategoryApi.getById(id)
      .then((data: any) => setCategory(data.category ?? data))
      .catch(() => setCategory(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40 }}>Đang tải...</div>;
  return <CategoryEditor mode="edit" category={category} />;
}
