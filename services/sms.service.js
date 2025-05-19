const logger = require("../logger");
const twilioClient = require("../twilio");
const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

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

module.exports = { sendOtp, verifyOtp };
