import { Resend } from "resend";
import OTP from "../models/otpModel.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function sendOtpService(email) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const html = `
    <div style="font-family:sans-serif;">
      <h2>Your OTP is: ${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
    </div>
  `;
    const result = await resend.emails.send({
        from: "Storage App <otp@rudrasatwara.tech>",
        to: email,
        subject: "Storage App OTP",
        html,
    });
    console.log(`this is sendService log --> ${result}`)

    if (result.error !== null) {
        throw new Error('Failed to send OTP email');
    }
    // Upsert OTP (replace if it already exists)
    await OTP.findOneAndUpdate(
        { email },
        { otp, createdAt: new Date() },
        { upsert: true }
    );



    return { success: true, message: `OTP sent successfully on ${email}` };
}