import nodemailer from 'nodemailer';

export async function GET(req) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    return new Response(JSON.stringify({ success: true, message: 'SMTP connected successfully' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message, stack: error.stack }), { status: 200 });
  }
}
