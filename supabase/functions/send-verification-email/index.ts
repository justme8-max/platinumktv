import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: VerificationEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Platinum High KTV <onboarding@resend.dev>",
      to: [email],
      subject: "Selamat Datang di Platinum High KTV! 🎤",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Platinum High KTV</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                          🎤 Platinum High KTV
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
                          Selamat Datang, ${fullName}!
                        </h2>
                        
                        <p style="margin: 0 0 16px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Terima kasih telah mendaftar di <strong>Platinum High KTV</strong>. Akun Anda telah berhasil dibuat!
                        </p>
                        
                        <p style="margin: 0 0 16px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Anda sekarang dapat mengakses sistem manajemen KTV kami dengan fitur-fitur berikut:
                        </p>
                        
                        <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #666666; font-size: 16px; line-height: 1.8;">
                          <li>Manajemen booking ruangan</li>
                          <li>Sistem kasir terintegrasi</li>
                          <li>Analytics dan laporan</li>
                          <li>Manajemen inventori</li>
                          <li>Notifikasi otomatis</li>
                        </ul>
                        
                        <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                          <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">
                            <strong>📧 Email Anda:</strong> ${email}
                          </p>
                        </div>
                        
                        <p style="margin: 24px 0 0 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Silakan login ke sistem untuk mulai menggunakan layanan kami.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0 0 8px 0; color: #999999; font-size: 14px; text-align: center;">
                          Email ini dikirim secara otomatis oleh sistem Platinum High KTV
                        </p>
                        <p style="margin: 0; color: #999999; font-size: 14px; text-align: center;">
                          Jika Anda tidak mendaftar akun ini, abaikan email ini.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
