const { v4: uuidv4 } = require("uuid");
const { FirebaseStorage } = require("../firebase");
const fs = require("fs");
const bucket = FirebaseStorage.bucket();
const Video = require("../models/video.model");
const { TranscoderServiceClient } =
  require("@google-cloud/video-transcoder").v1;
const logger = require("../logger");
const transcoderServiceClient = new TranscoderServiceClient();

const projectId = process.env.GC_PROJECT_ID;
const location = process.env.LOCATION;

async function listJobs() {
  const [jobs] = await transcoderServiceClient.listJobs({
    parent: transcoderServiceClient.locationPath(projectId, location),
  });
  for (const job of jobs) {
    console.log("Job:", job.name);
    const jobId = job.name.split("/").pop();
    console.log("Job ID:", jobId);
  }
}

async function getVideoTranscoderJob(video) {
  try {
    if (video.manifestUrl || !video.jobId) return;
    const request = {
      name: transcoderServiceClient.jobPath(projectId, location, video.jobId),
    };
    const [response] = await transcoderServiceClient.getJob(request);
    if (response.state === "SUCCEEDED") {
      const remoteFile = bucket.file(
        "transcoded/" + video.filename + "/manifest.m3u8"
      );
      const [manifestUrl] = await remoteFile.getSignedUrl({
        action: "read",
        expires: "01-01-3000",
      });
      await Video.findByIdAndUpdate(video._id, {
        manifestUrl: manifestUrl,
      });
      logger.info(`Video transcoder job succeeded`, response);
    }
  } catch (error) {
    logger.error("Error getting transcode job", error);
  }
}

const createVideoTranscoderJob = async (video) => {
  try {
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
    const jobId = response.name.split("/").pop();
    await Video.findByIdAndUpdate(video._id, {
      jobId: jobId,
    });
    logger.info(`Video transcode job`, response);
  } catch (error) {
    logger.error("Error creating transcode job", error);
  }
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
  getVideoTranscoderJob,
};
