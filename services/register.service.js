const { generateFromEmail } = require("unique-username-generator");
const User = require("../models/user.model");
const { sendVerificationLink } = require("../services/gmail.service");
const { defaultAvatar } = require("../utils/constant");
const { FirebaseAuth } = require("../core/firebase");
const logger = require("../core/logger");

/**
 * Handles the registration of a new user.
 * Creates a user in Firebase Auth and then in the application's database.
 * Sends a verification email.
 * @param {string} email User's email.
 * @param {string} password User's password.
 * @returns {Promise<object>} An object containing the new user's ID.
 * @throws {Error} If registration fails at any step.
 */
const registerUser = async (email, password) => {
  const displayName = generateFromEmail(email, 3);

  // Create user in Firebase Authentication
  const userRecord = await FirebaseAuth.createUser({
    email: email,
    password: password, // TODO: Use secret encryption for password - This is a reminder for Firebase's client-side password handling, usually not server-side for Firebase Auth.
    displayName: displayName,
    photoURL: defaultAvatar,
    emailVerified: false,
    disabled: false,
  });

  // Create user in MongoDB
  const newUser = await User.create({
    email,
    password, // Consider encrypting this if storing in your DB, or only store Firebase UID
    username: userRecord.displayName,
    uid: userRecord.uid,
    image: defaultAvatar,
    currency: "VND", // Default currency
  });

  logger.info("New user created in DB:", newUser.email);

  // Send email verification link
  await sendVerificationLink(email);

  return { userId: newUser.id };
};

/**
 * Sets the account type (role) for a user.
 * @param {string} userId The ID of the user.
 * @param {string} role The role to set ("RESTAURANT" or "CUSTOMER").
 * @returns {Promise<string>} The updated role of the user.
 * @throws {Error} If the role is invalid, user is not found, or role cannot be changed.
 */
const updateUserAccountType = async (userId, role) => {
  if (role !== "RESTAURANT" && role !== "CUSTOMER") {
    throw new Error("Not a valid account role");
  }

  const existingUser = await User.findById(userId);

  if (!existingUser) {
    throw new Error("User not found."); // More specific than "Something went wrong"
  }

  if (existingUser.role) {
    throw new Error("Cannot change role once it's already set.");
  }

  existingUser.role = role;
  await existingUser.save();

  return existingUser.role;
};

module.exports = {
  registerUser,
  updateUserAccountType,
};
