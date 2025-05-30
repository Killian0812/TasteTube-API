const axios = require("axios");
const googleMapsConfig = require("../config/googleMaps.config");

// Distance between two addresses in meters
const getDistanceBetweenAddress = async (originAddress, destinationAddress) => {
  const origin = `${originAddress.latitude},${originAddress.longitude}`;
  const destination = `${destinationAddress.latitude},${destinationAddress.longitude}`;
  const url = `${googleMapsConfig.baseUrl}/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=${googleMapsConfig.apiKey}`;

  const response = await axios.get(url);
  const distance = response.data.rows[0]?.elements[0]?.distance?.value;
  return distance ?? -1;
};

// Distance between two coordinates in kilometers (Haversine)
function calculateDistanceBetweenAddress(originAddress, destinationAddress) {
  const R = 6371; // Earth's radius in km
  const dLat =
    ((destinationAddress.latitude - originAddress.latitude) * Math.PI) / 180;
  const dLng =
    ((destinationAddress.longitude - originAddress.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((originAddress.latitude * Math.PI) / 180) *
      Math.cos((destinationAddress.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  getDistanceBetweenAddress,
  calculateDistanceBetweenAddress,
};
