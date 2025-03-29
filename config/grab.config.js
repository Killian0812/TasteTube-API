const grabConfig = {
  tokenUrl: "https://partner-api.grab.com/grabid/v1/oauth2/token",
  baseUrl: "https://partner-api.grab.com/grab-express-sandbox/v1",
  clientId: process.env.GRAB_CLIENT_ID,
  clientSecret: process.env.GRAB_CLIENT_SECRET,
};

let _grabAccessToken = null;
const getGrabAccessToken = () => _grabAccessToken;
const setGrabAccessToken = (newToken) => (_grabAccessToken = newToken);

module.exports = {
  grabConfig,
  getGrabAccessToken,
  setGrabAccessToken,
};
