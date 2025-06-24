const axios = require("axios");
const { getValue, setValue } = require("../core/redis");
const googleMapsConfig = require("../config/googleMaps.config");

// Distance between two addresses in meters
const getDistanceBetweenAddress = async (originAddress, destinationAddress) => {
  const cacheKey = `distance:google:${originAddress._id.toString()}-${destinationAddress._id.toString()}`;
  const cachedDistance = await getValue(cacheKey);
  if (cachedDistance !== null) {
    return parseFloat(cachedDistance);
  }

  const origin = `${originAddress.latitude},${originAddress.longitude}`;
  const destination = `${destinationAddress.latitude},${destinationAddress.longitude}`;
  const url = `${googleMapsConfig.baseUrl}/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=${googleMapsConfig.apiKey}`;

  const response = await axios.get(url);
  const distance = response.data.rows[0]?.elements[0]?.distance?.value ?? -1;

  await setValue(cacheKey, distance);
  return distance;
};

// Distance between two coordinates in kilometers (Haversine)
const calculateDistanceBetweenAddress = async (
  originAddress,
  destinationAddress
) => {
  const cacheKey = `distance:haversine:${originAddress._id.toString()}-${destinationAddress._id.toString()}`;
  const cachedDistance = await getValue(cacheKey);
  if (cachedDistance !== null) {
    return parseFloat(cachedDistance);
  }

  const distance = await calculateHaversineDistance(
    originAddress.longitude,
    originAddress.latitude,
    destinationAddress.longitude,
    destinationAddress.latitude
  );

  await setValue(cacheKey, distance);
  return distance;
};

// Unit can be 'km' or 'm'
const calculateHaversineDistance = ({
  lng1,
  lat1,
  lng2,
  lat2,
  unit = "km",
}) => {
  const R = unit === "km" ? 6371 : 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

module.exports = {
  getDistanceBetweenAddress,
  calculateDistanceBetweenAddress,
  calculateHaversineDistance,
};
