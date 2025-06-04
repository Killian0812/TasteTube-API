const logger = require("../core/logger");
const contentService = require("../services/content.service");

const search = async (req, res) => {
  try {
    const { keyword, type } = req.query;
    const result = await contentService.searchContent(
      keyword,
      type,
      req.userId
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFeeds = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await contentService.getPublicFeeds(req.userId, page, limit);
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFollowingFeeds = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await contentService.getFollowingFeeds(
      req.userId,
      page,
      limit
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  search,
  getFeeds,
  getFollowingFeeds,
};
