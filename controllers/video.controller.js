const Video = require('../models/video.model');
const User = require('../models/user.model');
const { uploadToFirebaseStorage, deleteFromFirebaseStorage } = require('../services/storage.service');

const getVideo = async (req, res) => {
    try {
        const videoId = req.params.videoId;
        if (!videoId)
            return res.status(401).json({ message: "Please specify a video" });
        const video = await Video.findById(videoId);
        if (!video)
            return res.status(404).json({ message: "Can't find requested video" });
        if (video.userId == req.userId)
            return res.status(200).json(video);
        switch (video.visibility) {
            case "PUBLIC":
                return res.status(200).json(video);
            case "FOLLOWERS_ONLY": {
                const ownerFollowers = (await User.findById(video.userId)).followers;
                if (ownerFollowers.includes(req.userId))
                    return res.status(200).json(video);
                return res.status(403).json({ message: "Content for followers only" });
            }
            case "PRIVATE":
                return res.status(403).json({ message: "Private content" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const uploadVideo = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const { title, description, products, hashtags, direction, thumbnail, visibility } = req.body;

        if (!user) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        const file = req.file;
        if (!file) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        const { url, filename } = await uploadToFirebaseStorage(file);

        const video = new Video({
            userId: req.userId,
            url: url,
            filename: filename,
            direction: direction,
            title: title,
            description: description,
            hashtags: hashtags,
            thumbnail: thumbnail,
            // products: products, // TODO: Fix this
            visibility: visibility,
        });
        video.save().then(async (video) => {
            user.videos.push(video._id);
            console.log(video._id);
            await user.save();
            return res.status(200).json({
                message: "Uploaded"
            })
        }).catch((e) => {
            return res.status(500).json({
                message: e
            })
        })
    } catch (error) {
        return res.status(500).json({ message: error });
    }
};

const deleteVideo = async (req, res) => {
    try {
        const videoId = req.params.videoId;
        if (!videoId)
            return res.status(401).json({ message: "Please specify a video" });
        const video = await Video.findById(videoId);
        if (!video)
            return res.status(404).json({ message: "Can't find requested video" });
        if (video.userId != req.userId)
            return res.status(403).json({ message: "You're not the owner of the video" });
        Video.deleteOne({ _id: videoId }).then(async (_) => {
            const user = await User.findById(req.userId);
            const updatedVideos = user.videos.filter((e) => e._id != videoId);
            user.videos = updatedVideos;
            await user.save();
            return res.status(200).json({
                message: "Deleted"
            })
        });
    } catch (error) {
        return res.status(500).json({ message: error });
    }
};

module.exports = { getVideo, uploadVideo, deleteVideo }