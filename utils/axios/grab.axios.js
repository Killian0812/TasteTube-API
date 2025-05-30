const axios = require("axios");

const {
  grabConfig,
  getGrabAccessToken,
  setGrabAccessToken,
} = require("../../config/grab.config");
const logger = require("../../core/logger");

const _reissueAccessToken = async () => {
  try {
    const response = await axios.post(
      grabConfig.tokenUrl,
      {
        client_id: grabConfig.clientId,
        client_secret: grabConfig.clientSecret,
        grant_type: "client_credentials",
        scope: "grab_express.partner_deliveries",
      },
      {
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
      }
    );
    const accessToken = response.data.access_token;
    setGrabAccessToken(accessToken);
    return accessToken;
  } catch (error) {
    logger.error("Failed to reissue access token:", error.message);
    return null;
  }
};

const grabAxios = axios.create({
  baseURL: grabConfig.baseUrl,
  headers: {
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
  },
});

grabAxios.interceptors.request.use(
  (config) => {
    const Authorization = config.headers.Authorization;
    if (Authorization) {
      return config;
    }
    const newConfig = config;
    newConfig.headers.Authorization = `Bearer ${getGrabAccessToken()}`;
    return newConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

grabAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const prevRequest = error.config;
    if (error.response.status === 401 && prevRequest && !prevRequest.sent) {
      prevRequest.sent = true;
      const newAccessToken = await _reissueAccessToken();
      if (newAccessToken) {
        prevRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return grabAxios(prevRequest);
      }
    }
    return Promise.reject(error);
  }
);

module.exports = grabAxios;
