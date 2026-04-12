import jwt from "jsonwebtoken";

export const isAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không có token, truy cập bị từ chối",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET chưa được cấu hình");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      _id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn, vui lòng đăng nhập lại",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};
