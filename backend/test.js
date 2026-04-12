import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("CONNECT OK");
    process.exit(0);
  })
  .catch((err) => {
    console.log("FAIL:", err.message);
    process.exit(1);
  });
