import mongoose from "mongoose";
const searchLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    query: { type: String, required: true },
    resultsCount: { type: Number },
    filters: { type: Map, of: mongoose.Schema.Types.Mixed },
    device: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
export default mongoose.models.Search ||
  mongoose.model("Search", searchLogSchema);
