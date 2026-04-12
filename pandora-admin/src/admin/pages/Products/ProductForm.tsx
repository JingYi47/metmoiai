import React, { useMemo, useEffect, useState } from "react";
import {
  Button, Card, Checkbox, Divider, Form, Input, InputNumber,
  Space, Switch, Upload, message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { Category, Product } from "../../../types";
import { adminCategoryApi, adminProductApi } from "../../../utils/apiClient";

function mainImagePublicId(
  file: any,
  productImages?: { url?: string; public_id?: string }[],
): string | undefined {
  if (file?.public_id) return file.public_id as string;
  const url = file?.url as string | undefined;
  if (url && productImages?.length) {
    const m = productImages.find((img) => img.url === url);
    if (m?.public_id) return m.public_id;
  }
  return undefined;
}

export type ProductFormValues = {
  name: string;
  brand: string;
  description: string;
  originalPrice: number;
  discountPrice?: number;
  categories?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
};

type ColorEntry = {
  name: string;
  stock: number;
  fileList: any[];
  existingImages: { url: string; public_id: string }[];
};

type SpecEntry = { key: string; value: string };

export function ProductForm({ mode, product }: { mode: "create" | "edit"; product?: (Product & any) | null }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ProductFormValues>();

  // Main product images
  const [mainImages, setMainImages] = useState<any[]>([]);

  // Colors
  const [colors, setColors] = useState<ColorEntry[]>([
    { name: "", stock: 0, fileList: [], existingImages: [] },
  ]);

  // Specifications
  const [specs, setSpecs] = useState<SpecEntry[]>([{ key: "", value: "" }]);

  useEffect(() => {
    adminCategoryApi.getAll()
      .then((data: any) => setCategories(Array.isArray(data) ? data : data.categories ?? []))
      .catch(() => {});
  }, []);

  // Populate when editing
  useEffect(() => {
    if (!product) return;

    // Main images
    if (product.images?.length) {
      setMainImages(
        product.images.map((img: any, i: number) => ({
          uid: `main-${i}`,
          name: `image-${i + 1}`,
          status: "done",
          url: img.url,
          public_id: img.public_id,
        }))
      );
    }

    // Colors
    if (product.colors?.length) {
      setColors(
        product.colors.map((c: any) => ({
          name: c.name,
          stock: c.stock ?? 0,
          fileList: [],
          existingImages: c.images ?? [],
        }))
      );
    }

    // Specs
    if (product.specifications) {
      const entries = Object.entries(product.specifications as Record<string, string>);
      if (entries.length) setSpecs(entries.map(([k, v]) => ({ key: k, value: v })));
    }
  }, [product]);

  const initial = useMemo<ProductFormValues>(() => {
    if (!product) {
      return { name: "", brand: "", description: "", originalPrice: 0, categories: [], isFeatured: false, isActive: true };
    }
    const catIds = Array.isArray(product.categories)
      ? product.categories.map((c: any) => (typeof c === "string" ? c : c._id))
      : product.category
      ? [typeof product.category === "string" ? product.category : product.category._id]
      : [];
    return {
      name: product.name,
      brand: product.brand ?? "",
      description: product.description ?? "",
      originalPrice: product.originalPrice ?? product.price ?? 0,
      discountPrice: product.price < product.originalPrice ? product.price : undefined,
      categories: catIds,
      isFeatured: product.isFeatured ?? false,
      isActive: product.isActive ?? true,
    };
  }, [product]);

  // Color helpers
  const addColor = () => setColors((prev) => [...prev, { name: "", stock: 0, fileList: [], existingImages: [] }]);
  const removeColor = (i: number) => setColors((prev) => prev.filter((_, idx) => idx !== i));
  const updateColor = (i: number, patch: Partial<ColorEntry>) =>
    setColors((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  // Spec helpers
  const addSpec = () => setSpecs((prev) => [...prev, { key: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs((prev) => prev.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, patch: Partial<SpecEntry>) =>
    setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const onFinish = async (values: ProductFormValues) => {
    const newMainFiles = mainImages.map((f) => f.originFileObj as File | undefined).filter(Boolean) as File[];

    const specsObj = Object.fromEntries(
      specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()])
    );

    const colorsPayload = colors
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        stock: c.stock,
        images: (c.existingImages ?? []).map((img) => ({
          url: img.url,
          ...(img.public_id ? { public_id: img.public_id } : {}),
        })),
      }));

    const payload: Record<string, any> = {
      name: values.name,
      brand: values.brand,
      description: values.description,
      originalPrice: values.originalPrice,
      price: values.discountPrice ?? values.originalPrice,
      category: (values.categories ?? [])[0],
      isFeatured: values.isFeatured ?? false,
      isActive: values.isActive ?? true,
      specifications: specsObj,
      colors: colorsPayload,
    };

    setSaving(true);
    try {
      let savedId: string;
      if (mode === "create") {
        const res = await adminProductApi.create(payload);
        savedId = res.product?._id ?? res._id;
        if (!savedId) throw new Error(res.message || "Tạo sản phẩm thất bại");
        message.success("Đã tạo sản phẩm");
      } else {
        if (!product) return;
        const pid = product._id;

        const keptMainIds = new Set(
          mainImages
            .map((f) => mainImagePublicId(f, product.images))
            .filter(Boolean) as string[],
        );
        const removedMain = (product.images ?? []).filter(
          (img: { public_id?: string }) => img.public_id && !keptMainIds.has(img.public_id),
        );
        await Promise.allSettled(
          removedMain.map((img: { public_id: string }) => adminProductApi.deleteImage(pid, img.public_id)),
        );

        for (const orig of product.colors ?? []) {
          const row = colors.find(
            (c) => c.name.trim().toLowerCase() === String(orig.name).toLowerCase(),
          );
          const keptColor = new Set(
            (row?.existingImages ?? [])
              .map((img) => img.public_id)
              .filter(Boolean) as string[],
          );
          const removedColor = (orig.images ?? []).filter(
            (img: { public_id?: string }) => img.public_id && !keptColor.has(img.public_id),
          );
          await Promise.allSettled(
            removedColor.map((img: { public_id: string }) =>
              adminProductApi.deleteColorImage(pid, orig.name, img.public_id),
            ),
          );
        }

        await adminProductApi.update(pid, payload);
        savedId = pid;
        message.success("Đã cập nhật sản phẩm");
      }

      // Upload main images
      if (newMainFiles.length > 0) {
        await Promise.allSettled(newMainFiles.map((f) => adminProductApi.addImage(savedId, f)));
        message.success(`Đã upload ${newMainFiles.length} ảnh chính`);
      }

      // Upload color images
      for (const color of colors) {
        const colorFiles = color.fileList
          .map((f: any) => f.originFileObj as File | undefined)
          .filter(Boolean) as File[];
        if (colorFiles.length > 0) {
          await Promise.allSettled(
            colorFiles.map((f) => adminProductApi.addColorImage(savedId, color.name, f))
          );
        }
      }

      navigate("/products");
    } catch (err: any) {
      message.error(err.message || "Lỗi lưu sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <a onClick={() => navigate(-1)} style={{ color: "#6b7280" }}>← back</a>
          <h1 className="page-title" style={{ marginTop: 6 }}>
            {mode === "create" ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"}
          </h1>
        </div>
        <Space>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>Save</Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" initialValues={initial} onFinish={onFinish}>
        <div className="grid" style={{ gridTemplateColumns: "1.4fr 0.6fr", alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Basic info */}
            <div className="card card-pad">
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>Thông tin cơ bản</h3>
              <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: "Nhập tên sản phẩm" }]}>
                <Input placeholder="Tên sản phẩm" />
              </Form.Item>
              <Form.Item label="Thương hiệu" name="brand" rules={[{ required: true, message: "Nhập thương hiệu" }]}>
                <Input placeholder="Apple, Samsung, Sony..." />
              </Form.Item>
              <Form.Item label="Mô tả" name="description" rules={[{ required: true, message: "Nhập mô tả" }]}>
                <Input.TextArea rows={4} placeholder="Mô tả sản phẩm" />
              </Form.Item>
            </div>

            {/* Main images */}
            <div className="card card-pad">
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Hình ảnh chính</h3>
              <Upload
                listType="picture-card"
                fileList={mainImages}
                accept="image/*"
                beforeUpload={() => false}
                onChange={({ fileList }) => setMainImages(fileList)}
                onPreview={(file) => window.open(file.url || URL.createObjectURL(file.originFileObj as File))}
              >
                {mainImages.length < 8 && (
                  <div><PlusOutlined /><div style={{ marginTop: 8, fontSize: 12 }}>Thêm ảnh</div></div>
                )}
              </Upload>
            </div>

            {/* Price */}
            <div className="card card-pad">
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>Giá</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Form.Item label="Giá gốc" name="originalPrice" rules={[{ required: true, message: "Nhập giá" }]}>
                  <InputNumber style={{ width: "100%" }} min={0} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
                </Form.Item>
                <Form.Item label="Giá khuyến mãi" name="discountPrice" help="Để trống nếu không giảm giá">
                  <InputNumber style={{ width: "100%" }} min={0} placeholder="Để trống nếu không giảm" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
                </Form.Item>
              </div>
            </div>

            {/* Colors */}
            <div className="card card-pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Màu sắc & Tồn kho</h3>
                <Button size="small" icon={<PlusOutlined />} onClick={addColor}>Thêm màu</Button>
              </div>
              {colors.map((color, i) => (
                <div key={i} style={{ border: "1px solid #e5e9f2", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tên màu</div>
                      <Input
                        placeholder="VD: Black, White, Blue..."
                        value={color.name}
                        onChange={(e) => updateColor(i, { name: e.target.value })}
                      />
                    </div>
                    <div style={{ width: 140 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tồn kho</div>
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        value={color.stock}
                        onChange={(v) => updateColor(i, { stock: v ?? 0 })}
                      />
                    </div>
                    {colors.length > 1 && (
                      <Button danger icon={<DeleteOutlined />} onClick={() => removeColor(i)} />
                    )}
                  </div>

                  {/* Existing color images */}
                  {color.existingImages.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Ảnh hiện tại</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {color.existingImages.map((img, j) => (
                          <div key={j} style={{ position: "relative", width: 60, height: 60 }}>
                            <img
                              src={img.url}
                              width={60}
                              height={60}
                              alt=""
                              style={{ borderRadius: 8, objectFit: "cover", border: "1px solid #e5e9f2" }}
                            />
                            <Button
                              type="primary"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                minWidth: 22,
                                width: 22,
                                height: 22,
                                padding: 0,
                                borderRadius: "50%",
                              }}
                              onClick={() =>
                                updateColor(i, {
                                  existingImages: color.existingImages.filter((_, idx) => idx !== j),
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Thêm ảnh cho màu này</div>
                  <Upload
                    listType="picture-card"
                    fileList={color.fileList}
                    accept="image/*"
                    beforeUpload={() => false}
                    onChange={({ fileList }) => updateColor(i, { fileList })}
                    onPreview={(file) => window.open(file.url || URL.createObjectURL(file.originFileObj as File))}
                  >
                    {color.fileList.length < 5 && (
                      <div><PlusOutlined /><div style={{ marginTop: 4, fontSize: 11 }}>Ảnh</div></div>
                    )}
                  </Upload>
                </div>
              ))}
            </div>

            {/* Specifications */}
            <div className="card card-pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Thông số kỹ thuật</h3>
                <Button size="small" icon={<PlusOutlined />} onClick={addSpec}>Thêm</Button>
              </div>
              {specs.map((spec, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <Input
                    placeholder="Tên thông số (VD: CPU)"
                    value={spec.key}
                    onChange={(e) => updateSpec(i, { key: e.target.value })}
                    style={{ width: 160 }}
                  />
                  <Input
                    placeholder="Giá trị (VD: Apple A17 Pro)"
                    value={spec.value}
                    onChange={(e) => updateSpec(i, { value: e.target.value })}
                  />
                  <Button icon={<DeleteOutlined />} onClick={() => removeSpec(i)} disabled={specs.length === 1} />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Category */}
            <Card className="card" bodyStyle={{ padding: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Danh mục</div>
              <Form.Item name="categories" style={{ marginBottom: 0 }} rules={[{ required: true, message: "Chọn ít nhất 1 danh mục" }]}>
                <Checkbox.Group style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {categories.map((c) => (
                    <Checkbox key={c._id} value={c._id}>{c.name}</Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>
              <Divider style={{ margin: "12px 0" }} />
              <a style={{ color: "#2563eb" }} onClick={() => navigate("/categories")}>+ Thêm danh mục mới</a>
            </Card>

            {/* Status */}
            <Card className="card" bodyStyle={{ padding: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Trạng thái</div>
              <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 10 }}>
                <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
              </Form.Item>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Hiển thị sản phẩm trên trang</div>
              <Form.Item name="isFeatured" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch checkedChildren="Nổi bật" unCheckedChildren="Thường" />
              </Form.Item>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Đánh dấu sản phẩm nổi bật</div>
            </Card>

          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
        </div>
      </Form>
    </div>
  );
}




