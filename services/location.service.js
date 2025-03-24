const axios = require("axios");

// Distance between two addresses in meters
const getDistanceBetweenAddress = async (originAddress, destinationAddress) => {
  const origin = `${originAddress.latitude},${originAddress.longitude}`;
  const destination = `${destinationAddress.latitude},${destinationAddress.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=${process.env.GOOGLE_MAPS_APIKEY}`;

  const response = await axios.get(url);
  const distance = response.data.rows[0]?.elements[0]?.distance?.value;
  return distance ?? -1;
};

module.exports = {
  getDistanceBetweenAddress,
};
