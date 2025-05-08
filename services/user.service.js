const User = require("../models/user.model");
const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
} = require("../services/storage.service");
const { kickoutUser } = require("../socket");

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
    const oldFilename = user.filename;
    user.filename = filename;
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

const getUsers = async ({ page, limit, role, status, search }) => {
  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    select: "-videos -password", // Exclude
    sort: { createdAt: -1 },
  };

  const query = {
    role: { $ne: "ADMIN" }, // Exclude users with role ADMIN
  };
  if (role) {
    query.role = role;
  }
  if (status) {
    query.status = status;
  }
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const result = await User.paginate(query, options);

  // Transform docs to include videos: []
  const users = result.docs.map((doc) => ({
    ...doc.toObject(),
    videos: [],
  }));

  return {
    users,
    totalDocs: result.totalDocs,
    limit: result.limit,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    page: result.page,
    totalPages: result.totalPages,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  };
};

const updateUserStatus = async (userId, newStatus) => {
  if (!userId) {
    throw new Error("No user found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.status = newStatus;
  await Promise.all([
    newStatus === "BANNED" ? kickoutUser(userId) : Promise.resolve(),
    user.save(),
  ]);

  delete user.password;
  user.videos = [];

  return user;
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  changePassword,
  followUser,
  unfollowUser,
  getUsers,
  updateUserStatus,
};
