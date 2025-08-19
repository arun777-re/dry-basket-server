import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string

):Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAILGUN_HOST,
    port: Number(process.env.MAILGUN_PORT) || 587,
    auth: {
      user: process.env.MAILGUN_USER!,
      pass: process.env.MAILGUN_PASS!,
    },
  });

  const mailOptions = {
    from: `Dry Basket <${process.env.MAILGUN_USER}>`,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Mail sent:", info.messageId);
};
