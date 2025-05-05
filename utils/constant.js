const baseUrl = process.env.VERCEL
  ? "https://taste-tube-api.vercel.app"
  : "https://first-shepherd-legible.ngrok-free.app";
const defaultAvatar =
  "https://images2.thanhnien.vn/528068263637045248/2024/4/3/jack-1712114239424422902059.jpg";
const currencies = ["USD", "VND"];

const adminUsers = ["68178d7bdb5de3a52bd90bb2"];

module.exports = {
  baseUrl,
  defaultAvatar,
  currencies,
  adminUsers,
};
