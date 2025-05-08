const User = require("../models/user.model");
const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
} = require("../services/storage.service");

const getUserInfo = async (userId, requestingUserId) => {
  if (!userId) {
    throw new Error("No user found");
  }

  const user = await User.findById(userId).populate({
    path: "videos",
    populate: [
      {
        path: "userId",
        select: "_id username image",
      },
      {
        path: "targetUserId",
        select: "_id username image",
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
            select: "_id image username phone",
          },
        ],
      },
    ],
  });

  if (!user) {
    throw new Error("User not found");
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
    follower.equals(requestingUserId)
  );

  const visibleVideos = videos.filter((video) => {
    let canView = false;
    if (video.visibility === "PRIVATE") {
      canView = video.userId.equals(requestingUserId);
    } else if (video.visibility === "FOLLOWERS_ONLY") {
      canView = video.userId.equals(requestingUserId) || isFollower;
    } else {
      canView = true;
    }
    return canView;
  });

  return {
    _id: userId,
    username,
    email,
    phone,
    filename,
    image,
    videos: visibleVideos,
    bio,
    role,
    followers,
    followings,
    isFollower,
  };
};

const updateUserInfo = async (
  userId,
  username,
  email,
  phone,
  bio,
  newImage,
  existingUsername
) => {
  const user = await User.findById(userId).populate({
    path: "videos",
    populate: [
      {
        path: "userId",
        select: "_id username image",
      },
      {
        path: "targetUserId",
        select: "_id username image",
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
            select: "_id image username phone",
          },
        ],
      },
    ],
  });

  if (!user) {
    throw new Error("Internal Server Error");
  }

  if (username && username.trim() !== user.username) {
    user.username = username.trim();
  }

  if (phone && phone.trim() !== user.phone) {
    const existingUserWithPhone = await User.findOne({ phone: phone.trim() });
    if (
      existingUserWithPhone &&
      existingUserWithPhone.username !== existingUsername
    ) {
      throw new Error("Phone number taken. Please check again");
    }
    user.phone = phone.trim();
  }

  if (email && email.trim() !== user.email) {
    const existingUserWithEmail = await User.findOne({ email: email.trim() });
    if (
      existingUserWithEmail &&
      existingUserWithEmail.username !== existingUsername
    ) {
      throw new Error("Email already taken. Please check again");
    }
    user.email = email.trim();
  }

  if (bio && bio.trim() !== user.bio) {
    user.bio = bio.trim();
  }

  if (newImage) {
    const { url, filename } = await uploadToFirebaseStorage(newImage);
    user.image = url;
    user.filename = filename;
    const oldFilename = user.filename;
    if (oldFilename) {
      setImmediate(async () => {
        await deleteFromFirebaseStorage(oldFilename);
      });
    }
  }

  await user.save();

  return {
    _id: userId,
    username: user.username,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    filename: user.filename,
    image: user.image,
    videos: user.videos,
    followers: user.followers,
    followings: user.followings,
  };
};

const changePassword = async (
  userId,
  oldPassword,
  newPassword,
  matchPassword
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Internal Server Error");
  }

  if (newPassword !== matchPassword) {
    throw new Error("Confirm password does not match");
  }

  if (oldPassword === user.password) {
    user.password = newPassword;
    await user.save();
    return { message: "Password saved" };
  } else {
    throw new Error("Current password does not correct");
  }
};

const followUser = async (userId, followerId) => {
  if (!userId) {
    throw new Error("No user found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.followers.includes(followerId)) {
    return { code: 1 };
  }

  user.followers.push(followerId);
  await user.save();
  return { code: 0 };
};

const unfollowUser = async (userId, followerId) => {
  if (!userId) {
    throw new Error("No user found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.followers.some((follower) => follower.equals(followerId))) {
    user.followers = user.followers.filter(
      (follower) => !follower.equals(followerId)
    );
    await user.save();
    return { code: 0 };
  }

  return { code: 1 };
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  changePassword,
  followUser,
  unfollowUser,
};
