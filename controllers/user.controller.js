const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
} = require("../services/storage.service");
const User = require("../models/user.model");

const getUserInfo = async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ message: "No user found" });
  }

  try {
    const user = await User.findById(userId).populate({
      path: "videos",
      populate: [
        {
          path: "userId",
          select: "_id username image", // Populate userId with id, username, and image
        },
        {
          path: "targetUserId",
          select: "_id username image", // Populate targetUserId with id, username, and image
        },
        {
          path: "products",
          populate: [
            {
              path: "category",
              select: "_id name",
            },
            {
              path: "userId",
              select: "_id image username",
            },
          ],
        },
        {
          path: "likes",
          select: "_id userId",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const {
      followers,
      followings,
      username,
      email,
      phone,
      bio,
      role,
      filename,
      image,
      videos,
    } = user;

    const isFollower = user.followers.some((follower) =>
      follower.equals(req.userId)
    );

    const visibleVideos = videos.filter((video) => {
      let canView = false;

      if (video.visibility === "PRIVATE") {
        canView = video.userId.equals(req.userId); // Only the owner can view
      } else if (video.visibility === "FOLLOWERS_ONLY") {
        canView = video.userId.equals(req.userId) || isFollower; // Only followers can view
      } else {
        canView = true;
      }

      return canView;
    });

    const videosWithUserLiked = visibleVideos.map((video) => ({
      ...video.toObject(),
      userLiked: video.likes.some((like) => like.userId.equals(req.userId)),
    }));

    return res.status(200).json({
      _id: userId,
      username,
      email,
      phone,
      filename,
      image,
      videos: videosWithUserLiked,
      bio,
      role,
      followers: followers,
      followings: followings,
      isFollower,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "videos",
      populate: [
        {
          path: "userId",
          select: "_id username image", // Populate userId with id, username, and image
        },
        {
          path: "targetUserId",
          select: "_id username image", // Populate targetUserId with id, username, and image
        },
        {
          path: "products",
          populate: {
            path: "category",
          },
        },
        {
          path: "likes",
          select: "_id userId",
        },
      ],
    });

    if (!user) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    let { username, email, phone, bio } = req.body;

    if (username && username.trim() !== user.username) {
      user.username = username.trim();
    }

    if (phone && phone.trim() !== user.phone) {
      const existingUserWithPhone = await User.findOne({ phone: phone.trim() });
      if (
        existingUserWithPhone &&
        existingUserWithPhone.username !== req.username
      ) {
        return res
          .status(400)
          .json({ message: "Phone number taken. Please check again" });
      }
      user.phone = phone.trim();
    }

    if (email && email.trim() !== user.email) {
      const existingUserWithEmail = await User.findOne({ email: email.trim() });
      if (
        existingUserWithEmail &&
        existingUserWithEmail.username !== req.username
      ) {
        return res
          .status(400)
          .json({ message: "Email already taken. Please check again" });
      }
      user.email = email.trim();
    }

    if (bio && bio.trim() !== user.bio) {
      user.bio = bio.trim();
    }

    const newImage = req.file;
    const oldFilename = user.filename;
    if (newImage) {
      const { url, filename } = await uploadToFirebaseStorage(newImage);
      user.image = url;
      user.filename = filename;
    }

    await user.save();

    // only delete old avatar when user save succeeded
    if (oldFilename)
      try {
        await deleteFromFirebaseStorage(oldFilename);
      } catch (error) {
        // shouldn't affect user response
        console.error("Error deleting old avatar:", error);
      }

    const { followers, followings, videos } = user;

    const videosWithUserLiked = videos.map((video) => ({
      ...video.toObject(),
      userLiked: video.likes.some((like) => like.userId.equals(user._id)),
    }));

    return res.status(200).json({
      _id: req.userId,
      username: user.username,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      filename: user.filename,
      image: user.image,
      videos: videosWithUserLiked,
      followers: followers,
      followings: followings,
    });
  } catch (error) {
    console.error("Error handling profile update:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const changePassword = async (req, res) => {
  console.log(`${req.username} changing password`);
  try {
    const user = await User.findById(req.userId);
    if (user) {
      const { oldPassword, newPassword, matchPassword } = req.body;
      if (newPassword !== matchPassword) {
        // console.log(newPassword, matchPassword);
        return res
          .status(401)
          .json({ message: "Confirm password does not match" });
      }

      if (oldPassword == user.password) {
        user.password = newPassword;
        await user.save();
        return res.status(200).json({ message: "Password saved" });
      } else
        return res
          .status(401)
          .json({ message: "Current password does not correct" });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const followUser = async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ message: "No user found", code: 2 });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.followers.includes(req.userId))
      return res.status(200).json({
        code: 1,
      });

    user.followers.push(req.userId);
    await user.save();
    return res.status(200).json({
      code: 0,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message, code: 2 });
  }
};

const unfollowUser = async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ message: "No user found", code: 2 });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.followers.some((follower) => follower.equals(req.userId))) {
      const filteredFollowers = user.followers.filter(
        (follower) => !follower.equals(req.userId)
      );
      user.followers = filteredFollowers;
      await user.save();
      return res.status(200).json({
        code: 0,
      });
    }

    return res.status(200).json({
      code: 1,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message, code: 2 });
  }
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  changePassword,
  followUser,
  unfollowUser,
};
