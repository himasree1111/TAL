import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Touch A Life" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Scholarship Selection Confirmation",

      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
          
          <div style="background: #2e7d32; color: white; padding: 20px; text-align: center;">
            <h2>🎉 Congratulations!</h2>
          </div>

          <div style="padding: 30px;">
            <p>Dear <strong>${name}</strong>,</p>

            <p>
              We are pleased to inform you that you have been 
              <strong>selected for the Touch A Life Scholarship Program</strong>.
            </p>

            <p>
              Your dedication and hard work have earned you this opportunity.
            </p>

            <div style="background:#e8f5e9;padding:15px;border-radius:6px;margin:20px 0;">
              Our team will contact you soon with further details.
            </div>

            <p>We wish you great success in your academic journey.</p>

            <p style="margin-top:30px;">
              Warm regards,<br/>
              <strong>Touch A Life Team</strong>
            </p>
          </div>

          <div style="background:#f1f1f1;padding:10px;text-align:center;font-size:12px;">
            © ${new Date().getFullYear()} Touch A Life
          </div>
        </div>
      </div>
      `,
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Email sending failed" });
  }
}