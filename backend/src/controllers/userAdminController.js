import { User } from "../models/userModel.js";
import { AdminLog } from "../models/adminlogModel.js";

//admin xem 1 user
export const getUserById = async (req, res) => {
  try {
    // chỉ admin được xem
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập",
      });
    }

    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Lỗi xem chi tiết user:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
//cập nhật role user
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role không hợp lệ",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật quyền thành công",
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Lấy tất cả user
export const getAllUsers = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Truy cập bị từ chối. Chỉ dành cho quản trị viên.",
      });
    }

    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách user:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ. Vui lòng thử lại sau.",
    });
  }
};

// XÓA USER (ADMIN)
export const deleteUser = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Truy cập bị từ chối. Chỉ dành cho quản trị viên.",
      });
    }

    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa người dùng thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa user:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ. Vui lòng thử lại sau.",
    });
  }
};
// LOCK USER
export const lockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: true },
    { new: true },
  ).select("-password");

  res.json({ success: true, user });
};
// UNLOCK USER
export const unlockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: false },
    { new: true },
  ).select("-password");

  res.json({ success: true, user });
};
