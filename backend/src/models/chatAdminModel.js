import mongoose from "mongoose";

const chatAdminSchema = new mongoose.Schema(
  {
    // Thông tin conversation
    conversationId: {
      type: String,
      required: true,
      unique: true,
      default: () => `CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    // Danh sách tin nhắn
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        senderType: {
          type: String,
          enum: ["user", "admin"],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        readAt: {
          type: Date,
          default: null,
        },
        attachments: [
          {
            fileName: String,
            fileUrl: String,
            fileType: String,
            fileSize: Number,
          },
        ],
        // Thêm trường products để lưu gợi ý từ AI
        products: [
          {
            name: String,
            slug: String,
            price: Number,
            images: [
              {
                url: String,
                public_id: String,
              },
            ],
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Thông tin conversation
    subject: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "closed", "pending"],
      default: "active",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      user: {
        type: Number,
        default: 0,
      },
      admin: {
        type: Number,
        default: 0,
      },
    },
    // Thông tin ticket liên quan (nếu có)
    ticketId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);


const ChatAdmin = mongoose.model("ChatAdmin", chatAdminSchema);
export default ChatAdmin;
