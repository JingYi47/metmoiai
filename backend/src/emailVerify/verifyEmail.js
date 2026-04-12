import nodemailer from "nodemailer";
import "dotenv/config";

export const verifyEmail = async (email, token, firstName = "Người dùng") => {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error("Thiếu cấu hình email trong .env");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/xac-thuc-email?token=${token}`;

    const mailConfigurations = {
      from: `"PandoraPro" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Xác Thực Email - PandoraPro",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="padding: 30px 25px; background: #ffffff;">
            <h2 style="color: #333; margin-bottom: 25px; font-weight: 600;">Xác Thực Email</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">Xin chào <strong style="color: #333;">${firstName}</strong>,</p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              Cảm ơn bạn đã đăng ký tài khoản tại <strong>PandoraPro</strong>. 
              Vui lòng nhấn vào nút bên dưới để hoàn tất xác thực email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background: #007bff; color: white; padding: 14px 32px; 
                        text-decoration: none; border-radius: 6px; font-weight: 500;
                        display: inline-block; border: none; cursor: pointer;">
                Xác Thực Email
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 25px;">
              Hoặc sao chép liên kết sau vào trình duyệt:<br>
              <span style="background: #f8f9fa; padding: 10px 15px; border-radius: 4px; 
                          border: 1px solid #dee2e6; display: block; margin-top: 10px; 
                          font-family: monospace; font-size: 13px; word-break: break-all;">
                ${verificationLink}
              </span>
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 25px; margin-top: 30px;">
              <p style="color: #999; font-size: 13px; margin-bottom: 8px;">
                ⏱️ Liên kết có hiệu lực trong 24 giờ
              </p>
              <p style="color: #999; font-size: 13px; margin-bottom: 8px;">
                Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.
              </p>
              <p style="color: #777; font-size: 14px; margin-top: 20px;">
                Trân trọng,<br>
                <strong>Đội ngũ PandoraPro</strong>
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Xác Thực Email PandoraPro\n\nXin chào ${firstName},\n\nCảm ơn bạn đã đăng ký. Vui lòng xác thực email bằng liên kết:\n${verificationLink}\n\nLiên kết có hiệu lực 24 giờ.\n\nTrân trọng,\nĐội ngũ PandoraPro`,
    };

    const info = await transporter.sendMail(mailConfigurations);
    console.log(`✅ Đã gửi email xác thực đến: ${email}`);

    return {
      success: true,
      messageId: info.messageId,
      email: email,
      verificationLink: verificationLink,
    };
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error.message);
    throw new Error(`Không thể gửi email: ${error.message}`);
  }
};

// Email chào mừng
export const sendWelcomeEmail = async (email, firstName = "Người dùng") => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"PandoraPro" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Chào Mừng Đến Với PandoraPro",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="padding: 30px 25px; background: #ffffff;">
            <h2 style="color: #333; margin-bottom: 25px; font-weight: 600;">Chào Mừng Bạn!</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Xin chào <strong style="color: #333;">${firstName}</strong>,
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              Email của bạn đã được xác thực thành công. Tài khoản PandoraPro của bạn đã sẵn sàng sử dụng.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" 
                 style="background: #2863a7; color: white; padding: 14px 32px; 
                        text-decoration: none; border-radius: 6px; font-weight: 500;
                        display: inline-block; border: none; cursor: pointer;">
                Truy Cập PandoraPro
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 25px; margin-top: 30px;">
              <p style="color: #777; font-size: 14px;">
                Trân trọng,<br>
                <strong>Đội ngũ PandoraPro</strong>
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Chào mừng đến với PandoraPro!\n\nXin chào ${firstName},\n\nEmail của bạn đã được xác thực thành công. Tài khoản đã sẵn sàng sử dụng.\n\nTruy cập: ${process.env.FRONTEND_URL || "http://localhost:5173"}\n\nTrân trọng,\nĐội ngũ PandoraPro`,
    };

    await transporter.sendMail(mailOptions);
    console.log(` Đã gửi email chào mừng đến: ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Lỗi gửi email chào mừng:", error.message);
    return { success: false };
  }
};
