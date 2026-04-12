// socket/chatAdminSocket.js
import ChatAdmin from "../models/chatAdminModel.js";

export const setupChatAdminSocket = (io) => {
  const chatNamespace = io.of("/chat-admin");

  chatNamespace.on("connection", (socket) => {
    console.log("User connected to chat:", socket.id);

    // Join room conversation
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation-${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave room
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation-${conversationId}`);
    });

    // Send message
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, message, senderId, senderType, attachments } =
          data;

        // Lưu vào database
        const conversation = await ChatAdmin.findOne({ conversationId });

        if (conversation) {
          const newMessage = {
            senderId,
            senderType,
            message,
            attachments: attachments || [],
            createdAt: new Date(),
          };

          conversation.messages.push(newMessage);
          conversation.lastMessageAt = new Date();

          if (senderType === "user") {
            conversation.unreadCount.admin += 1;
          } else {
            conversation.unreadCount.user += 1;
          }

          await conversation.save();

          // Emit message to all clients in room
          chatNamespace
            .to(`conversation-${conversationId}`)
            .emit("new-message", {
              conversationId,
              message: newMessage,
              senderType,
              senderId,
            });

          // Emit unread count update
          chatNamespace.emit("unread-update", {
            conversationId,
            unreadCount: conversation.unreadCount,
          });
        }
      } catch (error) {
        console.error("Socket send message error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      const { conversationId, isTyping, userType } = data;
      socket.to(`conversation-${conversationId}`).emit("user-typing", {
        conversationId,
        isTyping,
        userType,
      });
    });

    // Mark as read via socket
    socket.on("mark-read", async (data) => {
      try {
        const { conversationId, userId, userRole } = data;

        const conversation = await ChatAdmin.findOne({ conversationId });

        if (conversation) {
          const updateField =
            userRole === "admin" ? "unreadCount.admin" : "unreadCount.user";

          conversation.messages.forEach((msg) => {
            if (
              userRole === "admin" &&
              msg.senderType === "user" &&
              !msg.isRead
            ) {
              msg.isRead = true;
              msg.readAt = new Date();
            } else if (
              userRole === "user" &&
              msg.senderType === "admin" &&
              !msg.isRead
            ) {
              msg.isRead = true;
              msg.readAt = new Date();
            }
          });

          conversation[updateField] = 0;
          await conversation.save();

          chatNamespace
            .to(`conversation-${conversationId}`)
            .emit("messages-read", {
              conversationId,
              readBy: userRole,
            });
        }
      } catch (error) {
        console.error("Socket mark read error:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from chat:", socket.id);
    });
  });
};
