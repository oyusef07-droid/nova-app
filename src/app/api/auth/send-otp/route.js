import nodemailer from 'nodemailer';
import sql from '../../utils/sql';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const safeEmail = email.toLowerCase().trim();

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    // Save to database
    // Delete any existing tokens for this email first
    await sql`DELETE FROM auth_verification_token WHERE identifier = ${safeEmail}`;
    await sql`
      INSERT INTO auth_verification_token (identifier, token, expires)
      VALUES (${safeEmail}, ${otp}, ${expires})
    `;

    // Configure Nodemailer
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL_USER or EMAIL_PASS not set in .env. Skipping actual email send. OTP is:", otp);
      // Fallback for development without email credentials
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'OTP generated but not sent via email (missing credentials)',
        dev_otp: otp 
      }), { status: 200 });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Nova Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Account Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return new Response(JSON.stringify({ success: true, message: 'OTP sent to email' }), { status: 200 });
    } catch (mailError) {
      console.warn("SMTP Error (likely blocked by Hugging Face). Falling back to dev_otp:", mailError.message);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'SMTP failed, using fallback OTP',
        dev_otp: otp 
      }), { status: 200 });
    }

  } catch (error) {
    console.error('Error in send-otp:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request', details: error.message }), { status: 500 });
  }
}
