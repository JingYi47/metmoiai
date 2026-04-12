import React, { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { adminCouponApi } from "../../../utils/apiClient";

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    adminCouponApi.getAll()
      .then((data: any) => setCoupons(data.coupons ?? data ?? []))
      .catch(() => message.error("Không tải được coupon"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    const toDateInput = (v: any) => v ? new Date(v).toISOString().split("T")[0] : "";
    form.setFieldsValue({
      ...c,
      startDate: toDateInput(c.startDate),
      expiryDate: toDateInput(c.expiryDate),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await adminCouponApi.update(editing._id, values);
        message.success("Đã cập nhật coupon");
      } else {
        await adminCouponApi.create(values);
        message.success("Đã tạo coupon");
      }
      setOpen(false);
      load();
    } catch (err: any) {
      message.error(err.message || "Lỗi lưu coupon");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminCouponApi.delete(id);
      message.success("Đã xoá coupon");
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      message.error(err.message || "Lỗi xoá coupon");
    }
  };

  const columns = [
    {
      title: "Mã coupon",
      dataIndex: "code",
      key: "code",
      render: (v: string) => <Tag style={{ fontFamily: "monospace", fontSize: 13, borderRadius: 6 }}>{v}</Tag>,
    },
    {
      title: "Loại",
      dataIndex: "discountType",
      key: "discountType",
      render: (v: string) => v === "percentage" ? "Phần trăm (%)" : "Số tiền (VND)",
    },
    {
      title: "Giá trị",
      key: "value",
      render: (_: any, r: any) => r.discountType === "percentage" ? `${r.discountValue}%` : `${(r.discountValue ?? 0).toLocaleString()}đ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (v: boolean) => (
        <Tag color={v !== false ? "green" : "red"} style={{ borderRadius: 999 }}>
          {v !== false ? "Đang hoạt động" : "Tắt"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>Sửa</Button>
          <Popconfirm title="Xoá coupon này?" onConfirm={() => handleDelete(r._id)}>
            <Button danger size="small">Xoá</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Khuyến mãi</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm</Button>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <Table columns={columns} dataSource={coupons} rowKey="_id" loading={loading} pagination={{ pageSize: 15 }} />
      </div>

      <Modal
        title={editing ? "Sửa coupon" : "Tạo coupon mới"}
        open={open}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText="Lưu"
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã coupon" rules={[{ required: true, message: "Nhập mã coupon" }]}>
            <Input placeholder="VD: SUMMER20" style={{ textTransform: "uppercase" }} />
          </Form.Item>
          <Form.Item name="name" label="Tên coupon" rules={[{ required: true, message: "Nhập tên coupon" }]}>
            <Input placeholder="VD: Giảm hè 20%" />
          </Form.Item>
          <Form.Item name="discountType" label="Loại giảm giá" rules={[{ required: true }]} initialValue="percentage">
            <Select options={[{ value: "percentage", label: "Phần trăm (%)" }, { value: "fixed", label: "Số tiền cố định (VND)" }]} />
          </Form.Item>
          <Form.Item name="discountValue" label="Giá trị" rules={[{ required: true, message: "Nhập giá trị" }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="minOrderValue" label="Đơn tối thiểu (VND)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="expiryDate" label="Ngày hết hạn" rules={[{ required: true, message: "Chọn ngày hết hạn" }]}>
              <Input type="date" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
