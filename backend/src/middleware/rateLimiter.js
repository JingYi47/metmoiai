import SpamControl from "../models/spamControlModel.js";

// Cấu hình giới hạn
const RATE_LIMITS = {
  // Người dùng đã đăng nhập
  authenticated: {
    windowMs: 60 * 1000, // 1 phút
    maxRequests: 30, // 🔥 Tăng lên 30 tin nhắn/phút (từ 10)
    blockDuration: 1 * 60 * 1000, // 🔥 Giảm xuống 1 phút (từ 5)
  },
  // Khách (chưa đăng nhập)
  guest: {
    windowMs: 60 * 1000, // 1 phút
    maxRequests: 15, // 🔥 Tăng lên 15 tin nhắn/phút (từ 5)
    blockDuration: 2 * 60 * 1000, // 🔥 Giảm xuống 2 phút (từ 10)
  },
  // Giới hạn cứng
  hardLimit: {
    windowMs: 60 * 60 * 1000, // 1 giờ
    maxRequests: 200, // 🔥 Tăng lên 200 tin nhắn/giờ (từ 50)
    blockDuration: 30 * 60 * 1000, // Block 30 phút
  },
};

// Hàm kiểm tra spam
export const checkSpam = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const sessionId = req.headers["x-session-id"] || req.sessionID;
    const ip = req.ip || req.connection.remoteAddress;

    // Xác định loại người dùng
    const userType = userId ? "authenticated" : "guest";
    const limits = RATE_LIMITS[userType];

    // Tìm record spam control
    let spamControl = await SpamControl.findOne({
      $or: [{ user: userId }, { sessionId: sessionId }, { ip: ip }],
    });

    // Nếu đang bị block
    if (
      spamControl &&
      spamControl.blockedUntil &&
      spamControl.blockedUntil > new Date()
    ) {
      const remainingTime = Math.ceil(
        (spamControl.blockedUntil - new Date()) / 1000,
      );
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;

      return res.status(429).json({
        success: false,
        message: `Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau ${minutes} phút ${seconds} giây.`,
        remainingBlockTime: remainingTime,
        blocked: true,
      });
    }

    // Nếu chưa có record, tạo mới
    if (!spamControl) {
      spamControl = new SpamControl({
        user: userId || null,
        sessionId: sessionId,
        ip: ip,
        messageCount: 1,
        lastMessageAt: new Date(),
      });
      await spamControl.save();
      return next();
    }

    // Tính thời gian từ tin nhắn cuối
    const timeSinceLastMessage =
      Date.now() - new Date(spamControl.lastMessageAt).getTime();

    // Reset count nếu đã qua windowMs
    if (timeSinceLastMessage > limits.windowMs) {
      spamControl.messageCount = 1;
      spamControl.lastMessageAt = new Date();
      await spamControl.save();
      return next();
    }

    // Kiểm tra số lượng tin nhắn trong window
    if (spamControl.messageCount >= limits.maxRequests) {
      // Block user
      spamControl.blockedUntil = new Date(Date.now() + limits.blockDuration);
      spamControl.blockCount += 1;
      spamControl.messageCount = 1;
      await spamControl.save();

      const minutes = Math.floor(limits.blockDuration / 60000);
      return res.status(429).json({
        success: false,
        message: `Bạn đã gửi quá ${limits.maxRequests} tin nhắn trong 1 phút. Tạm thời bị khóa trong ${minutes} phút.`,
        blocked: true,
        blockDuration: limits.blockDuration,
      });
    }

    // Kiểm tra hard limit (giới hạn cứng theo giờ)
    const oneHourAgo = new Date(Date.now() - RATE_LIMITS.hardLimit.windowMs);
    const totalMessagesInHour = await SpamControl.aggregate([
      {
        $match: {
          $or: [{ user: userId }, { sessionId: sessionId }, { ip: ip }],
          createdAt: { $gte: oneHourAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$messageCount" },
        },
      },
    ]);

    if (
      totalMessagesInHour.length > 0 &&
      totalMessagesInHour[0].total >= RATE_LIMITS.hardLimit.maxRequests
    ) {
      spamControl.blockedUntil = new Date(
        Date.now() + RATE_LIMITS.hardLimit.blockDuration,
      );
      await spamControl.save();

      return res.status(429).json({
        success: false,
        message: `Bạn đã gửi quá ${RATE_LIMITS.hardLimit.maxRequests} tin nhắn trong 1 giờ. Tạm thời bị khóa.`,
        blocked: true,
      });
    }

    // Tăng số lượng tin nhắn
    spamControl.messageCount += 1;
    spamControl.lastMessageAt = new Date();
    await spamControl.save();

    // Thêm headers để client biết giới hạn
    res.setHeader("X-RateLimit-Limit", limits.maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      limits.maxRequests - spamControl.messageCount,
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + limits.windowMs).toISOString(),
    );

    next();
  } catch (error) {
    console.error("Spam check error:", error);
    // Nếu có lỗi, vẫn cho phép chat để tránh ảnh hưởng trải nghiệm
    next();
  }
};

// Middleware giới hạn độ dài tin nhắn
export const checkMessageLength = (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Tin nhắn không được để trống",
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Tin nhắn không được vượt quá 1000 ký tự",
    });
  }

  // Kiểm tra spam pattern (lặp lại ký tự)
  const repeatPattern = /(.)\1{10,}/; // Lặp lại 10 lần cùng 1 ký tự
  if (repeatPattern.test(message)) {
    return res.status(400).json({
      success: false,
      message: "Tin nhắn chứa nội dung spam (lặp lại ký tự)",
    });
  }

  // Kiểm tra URL spam (quá nhiều link)
  const urlCount = (message.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 3) {
    return res.status(400).json({
      success: false,
      message: "Không được gửi quá 3 link trong một tin nhắn",
    });
  }

  next();
};

// Middleware kiểm tra cooldown giữa các tin nhắn
export const checkCooldown = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const sessionId = req.headers["x-session-id"] || req.sessionID;
    const minInterval = 2000; // 2 giây giữa các tin nhắn

    const lastMessage = await SpamControl.findOne({
      $or: [{ user: userId }, { sessionId: sessionId }],
    }).sort({ lastMessageAt: -1 });

    if (lastMessage && lastMessage.lastMessageAt) {
      const timeSinceLast =
        Date.now() - new Date(lastMessage.lastMessageAt).getTime();
      if (timeSinceLast < minInterval) {
        const remainingTime = Math.ceil((minInterval - timeSinceLast) / 1000);
        return res.status(429).json({
          success: false,
          message: `Vui lòng đợi ${remainingTime} giây trước khi gửi tin nhắn tiếp theo`,
          cooldown: true,
          remainingTime: remainingTime,
        });
      }
    }

    next();
  } catch (error) {
    console.error("Cooldown check error:", error);
    next();
  }
};

// API lấy thông tin rate limit của user
export const getRateLimitStatus = async (req, res) => {
  try {
    const userId = req.user?._id;
    const sessionId = req.headers["x-session-id"] || req.sessionID;
    const ip = req.ip || req.connection.remoteAddress;

    const spamControl = await SpamControl.findOne({
      $or: [{ user: userId }, { sessionId: sessionId }, { ip: ip }],
    });

    const userType = userId ? "authenticated" : "guest";
    const limits = RATE_LIMITS[userType];

    let remaining = limits.maxRequests;
    let resetTime = null;

    if (spamControl) {
      const timeSinceLast =
        Date.now() - new Date(spamControl.lastMessageAt).getTime();
      if (timeSinceLast < limits.windowMs) {
        remaining = Math.max(0, limits.maxRequests - spamControl.messageCount);
        resetTime = new Date(
          spamControl.lastMessageAt.getTime() + limits.windowMs,
        );
      }
    }

    res.json({
      success: true,
      data: {
        userType: userType,
        limit: limits.maxRequests,
        remaining: remaining,
        resetTime: resetTime,
        isBlocked: spamControl?.blockedUntil > new Date(),
        blockedUntil: spamControl?.blockedUntil,
      },
    });
  } catch (error) {
    console.error("Get rate limit status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thông tin giới hạn",
    });
  }
};
