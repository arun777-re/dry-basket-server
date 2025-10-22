import formData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: process.env.SMTP_MAILGUN_ID!,
  key: process.env.SMTP_MAILGUN_SECRET!,
});

export async function sendEmailWithNodemailer({
  to,
  subject,
  email,
}: {
  to: string;
  subject: string;
  email: string;
}) {
  try {
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
      from: process.env.MAIL_FROM!,
      to,
      subject,
      html: email,
    });

    console.log("✅ Email sent successfully:", result.id);
    return result;
  } catch (error: any) {
    console.error("❌ Error sending email:", error.message || error);
    throw new Error("Error sending email");
  }
}
