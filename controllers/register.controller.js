const registerService = require("../services/register.service");
const logger = require("../core/logger");

const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await registerService.registerUser(email, password);
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error in register controller:", error);
    // Firebase Auth errors often have specific codes, you might want to parse them.
    // For simplicity, we'll return a general 400 or 500.
    const errorMessage =
      error.message || "Registration failed. Please try again.";
    return res.status(400).json({ message: errorMessage });
  }
};

const setAccountType = async (req, res) => {
  const { userId, role } = req.body;

  // Basic validation for required fields at the controller level
  if (!userId || !role) {
    return res.status(400).json({ message: "User ID and role are required." });
  }

  try {
    const updatedRole = await registerService.updateUserAccountType(
      userId,
      role
    );
    return res.status(200).json({
      message: "Account role updated successfully",
      role: updatedRole,
    });
  } catch (error) {
    logger.error("Error in setAccountType controller:", error);
    const errorMessage =
      error.message || "Failed to update account type. Please try again later.";

    // Handle specific errors from service to return appropriate HTTP status
    if (
      errorMessage === "Not a valid account role" ||
      errorMessage === "User not found." ||
      errorMessage === "Cannot change role once it's already set."
    ) {
      return res.status(400).json({ message: errorMessage });
    } else {
      return res.status(500).json({ message: errorMessage });
    }
  }
};

module.exports = { register, setAccountType };
