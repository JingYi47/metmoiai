import nodemailer from "nodemailer";

export const sendOtpEmail = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"E-Commerce Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Mã OTP đặt lại mật khẩu",
    html: `
      <h2>Đặt lại mật khẩu</h2>
      <p>Mã OTP của bạn là:</p>
      <h1 style="color:red">${otp}</h1>
      <p>Mã có hiệu lực trong <b>10 phút</b>.</p>
      <p>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
