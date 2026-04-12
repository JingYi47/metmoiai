import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./src/database/db.js";
import userRoute from "./src/routes/userRoute.js";
import adminUserRoutes from "./src/routes/adminUserRoute.js";
import productRoutes from "./src/routes/productRoute.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import checkoutRoutes from "./src/routes/checkoutRoute.js";
import couponRoutes from "./src/routes/couponRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import paymentRoutes from "./src/routes/paymentRoute.js";
import behaviorRoutes from "./src/routes/behaviorRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import recommendRoutes from "./src/routes/recommendRoutes.js";
import chatHistoryRoutes from "./src/routes/chatHistoryRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
// import chatAdminRoutes from "./src/routes/chatAdminRoutes.js";
// import { setupChatAdminSocket } from "./src/socket/chatAdminSocket.js";
import "./src/models/userModel.js";
import "./src/models/productModel.js";
import "./src/models/categoryModel.js";
import "./src/models/orderModel.js";
import "./src/models/cartModel.js";
import "./src/models/couponModel.js";
import "./src/models/adminlogModel.js";
import "./src/models/view.model.js";
import "./src/models/searchModel.js";
import "./src/models/behaviorModel.js";
import "./src/models/reviewModel.js";
// import { Server } from "socket.io";
// const io = new Server(server);
// setupChatAdminSocket(io);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRoute);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/uploads", express.static(path.join("uploads")));
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/checkout", checkoutRoutes);
app.use("/api/v1/coupon", couponRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/behavior", behaviorRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/recommend-ai", recommendRoutes);
app.use("/api/v1/chat", chatHistoryRoutes);
app.use("/api/v1/ai", aiRoutes);
// app.use("/api/v1chat", chatAdminRoutes);
// http://localhost:8000/api/v1/user/register

connectDB();

app.listen(PORT, () => {
  console.log(`Server is listening at port:${PORT}`);
});
