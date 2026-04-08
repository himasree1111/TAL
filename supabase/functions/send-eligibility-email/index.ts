import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("📤 Sending email...");

    const { email, name } = await req.json();

    if (!email || !name) {
      throw new Error("Missing email or name in request body.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer re_HrYLMJMn_3UVkUUiN6vvWPPgqq4JBkXAc`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "touchalife.team@gmail.com",
        to: email,
        subject: "🎉 Congratulations! You are eligible for the Touch A Life Scholarship Program",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #4CAF50;">🎉 Congratulations, ${name}!</h2>
            <p>We are pleased to inform you that you have been selected as an eligible candidate for the Touch A Life Scholarship Program.</p>
            <p>Your application has been carefully reviewed, and your performance has made you a deserving recipient.</p>
            <p>📌 Our team will contact you soon with further details.</p>
            <p>We wish you success in your academic journey.</p>
            <p>Warm regards,</p>
            <p><strong>Touch A Life Team</strong></p>
          </div>
        `,
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ message: "Email sent successfully!" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("❌ Email send error:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});