import nodemailer from 'nodemailer';
import sql from './src/app/api/utils/sql.js';

async function testOtp() {
  const email = "packetastore@gmail.com";
  const otp = "123456";
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  
  try {
    console.log("Testing DB Insert...");
    await sql`DELETE FROM auth_verification_token WHERE identifier = ${email}`;
    await sql`
      INSERT INTO auth_verification_token (identifier, token, expires)
      VALUES (${email}, ${otp}, ${expires})
    `;
    console.log("DB Insert successful!");
    
    console.log("Testing Nodemailer...");
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("No EMAIL_USER in .env");
      return;
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    await transporter.verify();
    console.log("Nodemailer Verify Successful!");
    
    console.log("Sending mail...");
    await transporter.sendMail({
      from: `"Nova Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Test',
      text: 'Test',
    });
    console.log("Mail sent successfully!");
  } catch (e) {
    console.error("Test Failed:", e.message, e);
  }
}

testOtp();
