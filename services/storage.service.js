const { v4: uuidv4 } = require("uuid");
const { FirebaseStorage } = require("../firebase");
const fs = require("fs");
const bucket = FirebaseStorage.bucket();
const Video = require("../models/video.model");
const { TranscoderServiceClient } =
  require("@google-cloud/video-transcoder").v1;
const logger = require("../logger");
const transcoderServiceClient = new TranscoderServiceClient();

const createVideoTranscoderJob = async (video) => {
  const remoteFile = bucket.file(video.filename);
  const inputUri = remoteFile.cloudStorageURI.href;
  const outputUri =
    process.env.STORAGE_BUCKET + "/transcoded/" + video.filename + "/";
  const request = {
    parent: transcoderServiceClient.locationPath(
      process.env.GC_PROJECT_ID,
      process.env.LOCATION
    ),
    job: {
      inputUri: inputUri,
      outputUri: outputUri,
      templateId: "preset/web-hd",
    },
  };
  const [response] = await transcoderServiceClient.createJob(request);
  await Video.findByIdAndUpdate(video._id, {
    jobId: response.jobId,
  });
  logger.info(`Video transcode job`, response);
};

const uploadToFirebaseStorage = async (file) => {
  try {
    const uuid = uuidv4();
    const remoteFile = bucket.file(uuid);

    if (!file.buffer) {
      const stream = fs.createReadStream(file.path);
      await remoteFile.save(stream, {
        contentType: file.mimetype,
        public: true,
      });
    } else {
      await remoteFile.save(file.buffer, {
        contentType: file.mimetype,
        public: true,
      });
    }

    const [downloadUrl] = await remoteFile.getSignedUrl({
      action: "read",
      expires: "01-01-3000",
    });

    logger.info("File uploaded to Firebase");
    return { url: downloadUrl, filename: uuid };
  } catch (err) {
    logger.error("Error uploading to Firebase:", err);
    throw new Error("Firebase upload failed");
  }
};

const deleteFromFirebaseStorage = async (filename) => {
  try {
    const fileRef = bucket.file(filename);
    await fileRef.delete();
    logger.info(`File ${filename} deleted successfully from Firebase`);
  } catch (error) {
    logger.error("Error deleting file from Firebase:", error);
  }
};

module.exports = {
  deleteFromFirebaseStorage,
  uploadToFirebaseStorage,
  createVideoTranscoderJob,
};
