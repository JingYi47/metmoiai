import ChatAdmin from "../models/chatAdminModel.js";
import { uploadImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// Get user chat history
export const getUserChatHistory = async (req, res) => {
  console.log("DEBUG: getUserChatHistory hit for user:", req.user?._id);
  try {
    const userId = req.user._id;
    let conversation = await ChatAdmin.findOne({ userId }).populate("userId", "name email avatar");

    if (!conversation) {
      // Create new conversation if not exists
      conversation = await ChatAdmin.create({
        userId,
        messages: [],
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all conversations (Admin)
export const getAdminConversations = async (req, res) => {
  try {
    const conversations = await ChatAdmin.find()
      .populate("userId", "name email avatar")
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload attachment
export const uploadChatAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await uploadImage(req.file.buffer, "chat_attachments");

    res.json({
      success: true,
      attachment: {
        fileUrl: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark as read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userRole } = req.body; // 'user' or 'admin'

    const conversation = await ChatAdmin.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const updateField = userRole === "admin" ? "unreadCount.admin" : "unreadCount.user";
    
    conversation.messages.forEach((msg) => {
      if (userRole === "admin" && msg.senderType === "user" && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = new Date();
      } else if (userRole === "user" && msg.senderType === "admin" && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = new Date();
      }
    });

    conversation[updateField] = 0;
    await conversation.save();

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
