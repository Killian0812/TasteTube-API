const logger = require("../core/logger");
const twilioClient = require("../core/twilio");
const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

const messageMap = {
  pending: "OTP verification is still pending. Please try again.",
  canceled: "OTP verification was canceled. Please request a new OTP.",
  max_attempts_reached:
    "Maximum OTP attempts reached. Please request a new OTP.",
  deleted: "OTP session was deleted. Please request a new OTP.",
  failed: "OTP verification failed. Please check the OTP and try again.",
  expired: "OTP has expired. Please request a new OTP.",
};

const sendOtp = async (phoneNumber) => {
  const otp = {
    code: Math.floor(100000 + Math.random() * 900000),
    activatedAt: Date.now(),
  };

  try {
    const response = await twilioClient.verify.v2
      .services(twilioServiceSID)
      .verifications.create({
        to: phoneNumber,
        customCode: otp.code,
        channel: "sms",
      });
    logger.info("OTP sent successfully:", {
      sid: response.sid,
      status: response.status,
      to: response.to,
      channel: response.channel,
      dateCreated: response.dateCreated,
    });
    return { response, otp };
  } catch (error) {
    logger.error("Error sending OTP:", error);
    throw error;
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  try {
    const response = await twilioClient.verify.v2
      .services(twilioServiceSID)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });
    logger.info("OTP verified successfully", {
      sid: response.sid,
      status: response.status,
      to: response.to,
      channel: response.channel,
      dateCreated: response.dateCreated,
    });
    return response;
  } catch (error) {
    logger.error("Error verifying OTP:", error);
    throw error;
  }
};

module.exports = { sendOtp, verifyOtp, messageMap };
