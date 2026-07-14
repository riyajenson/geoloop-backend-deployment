import nodemailer from 'nodemailer'

export const sendOtpEmail = async (email, otp) => {
  try {
    console.log("==========================================");
    console.log(`[DEV MODE] OTP Generated for ${email}: ${otp}`);
    console.log("==========================================");
    return { messageId: "mock-dev-id" };
  } catch (error) {
    console.error("Mock email dispatcher encountered an error:", error);
    throw error;
  }
}
