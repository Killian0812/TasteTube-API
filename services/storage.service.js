const { v4: uuidv4 } = require("uuid");
const { FirebaseStorage } = require("../core/firebase");
const fs = require("fs");
const bucket = FirebaseStorage.bucket();
const Video = require("../models/video.model");
const { TranscoderServiceClient } =
  require("@google-cloud/video-transcoder").v1;
const logger = require("../core/logger");
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
    console.log("Job", job);
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
      const manifestFile = bucket.file(
        `transcoded/${video.filename}/manifest_new.m3u8`
      );
      const sdFile = bucket.file(`transcoded/${video.filename}/sd.m3u8`);
      const hdFile = bucket.file(`transcoded/${video.filename}/hd.m3u8`);

      // Download sd.m3u8 and hd.m3u8 to extract .ts files
      const [sdContent] = await sdFile.download();
      const [hdContent] = await hdFile.download();
      const sdPlaylist = sdContent.toString();
      const hdPlaylist = hdContent.toString();

      // Extract .ts file names using regex
      const tsFileRegex = /[a-zA-Z0-9_-]+\.ts/g;
      const sdTsFiles = [...new Set(sdPlaylist.match(tsFileRegex) || [])];
      const hdTsFiles = [...new Set(hdPlaylist.match(tsFileRegex) || [])];

      // Generate signed URLs for .ts files
      const sdTsUrls = {};
      const hdTsUrls = {};
      const sdTsPromises = sdTsFiles.map(async (tsFile) => {
        const file = bucket.file(`transcoded/${video.filename}/${tsFile}`);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "01-01-3000",
        });
        sdTsUrls[tsFile] = url;
      });
      const hdTsPromises = hdTsFiles.map(async (tsFile) => {
        const file = bucket.file(`transcoded/${video.filename}/${tsFile}`);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "01-01-3000",
        });
        hdTsUrls[tsFile] = url;
      });
      await Promise.all([...sdTsPromises, ...hdTsPromises]);

      // Rewrite sd.m3u8 and hd.m3u8 with signed URLs
      let updatedSdPlaylist = sdPlaylist;
      let updatedHdPlaylist = hdPlaylist;
      for (const [tsFile, url] of Object.entries(sdTsUrls)) {
        updatedSdPlaylist = updatedSdPlaylist.replace(
          new RegExp(tsFile, "g"),
          url
        );
      }
      for (const [tsFile, url] of Object.entries(hdTsUrls)) {
        updatedHdPlaylist = updatedHdPlaylist.replace(
          new RegExp(tsFile, "g"),
          url
        );
      }

      // Save rewritten sub-playlists
      await sdFile.save(updatedSdPlaylist, {
        contentType: "application/x-mpegurl",
        public: true,
      });
      await hdFile.save(updatedHdPlaylist, {
        contentType: "application/x-mpegurl",
        public: true,
      });

      // Generate signed URLs for manifests
      const [manifestUrl] = await manifestFile.getSignedUrl({
        action: "read",
        expires: "01-01-3000",
      });
      const [sdUrl] = await sdFile.getSignedUrl({
        action: "read",
        expires: "01-01-3000",
      });
      const [hdUrl] = await hdFile.getSignedUrl({
        action: "read",
        expires: "01-01-3000",
      });

      // Hardcode manifest_new.m3u8 with sdUrl and hdUrl
      const updatedManifest = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=741257,AVERAGE-BANDWIDTH=741257,VIDEO-RANGE=SDR,FRAME-RATE=60,RESOLUTION=720x1280,CODECS="avc1.64001f,mp4a.40.2"
${sdUrl}
#EXT-X-STREAM-INF:BANDWIDTH=1971985,AVERAGE-BANDWIDTH=1971985,VIDEO-RANGE=SDR,FRAME-RATE=60,RESOLUTION=720x1280,CODECS="avc1.64001f,mp4a.40.2"
${hdUrl}`;

      // Save the rewritten manifest
      await manifestFile.save(updatedManifest, {
        contentType: "application/x-mpegurl",
        public: true,
      });

      // Update the video document
      await Video.findByIdAndUpdate(video._id, { manifestUrl });
      logger.info(`Video transcoder job succeeded`, response);
    }
  } catch (error) {
    logger.error("Error getting transcode job", error);
  }
}

async function _getVideoTranscoderJobTemplateId() {
  // Use a fixed template ID for persistence
  const customTemplateId = "tastetube-transcoder-template";
  const templatePath = transcoderServiceClient.jobTemplatePath(
    projectId,
    location,
    customTemplateId
  );
  logger.info(`Checking template: ${templatePath}`);

  // Check if the template already exists
  try {
    const [template] = await transcoderServiceClient.getJobTemplate({
      name: templatePath,
    });
    logger.info(
      `Template ${customTemplateId} already exists: ${template.name}`
    );
    return customTemplateId;
  } catch (error) {
    if (error.code === 5) {
      // Error code 5 indicates "NOT_FOUND"
      logger.info(
        `Template ${customTemplateId} not found, creating new template`
      );
      // Create the custom template
      const templateRequest = {
        parent: transcoderServiceClient.locationPath(projectId, location),
        jobTemplateId: customTemplateId,
        jobTemplate: {
          config: {
            elementaryStreams: [
              {
                key: "video-stream-sd",
                videoStream: {
                  h264: {
                    profile: "high",
                    bitrateBps: 600000, // Suitable for SD quality
                    frameRate: 60,
                  },
                },
              },
              {
                key: "video-stream-hd",
                videoStream: {
                  h264: {
                    profile: "high",
                    bitrateBps: 2000000, // Suitable for HD quality
                    frameRate: 60,
                  },
                },
              },
              {
                key: "audio-stream",
                audioStream: {
                  codec: "aac",
                  bitrateBps: 128000,
                },
              },
            ],
            muxStreams: [
              {
                key: "sd",
                container: "ts",
                elementaryStreams: ["video-stream-sd", "audio-stream"],
              },
              {
                key: "hd",
                container: "ts",
                elementaryStreams: ["video-stream-hd", "audio-stream"],
              },
            ],
            manifests: [
              {
                fileName: "manifest.m3u8",
                type: "HLS",
                muxStreams: ["sd", "hd"],
              },
            ],
          },
        },
      };
      try {
        const [jobTemplate] = await transcoderServiceClient.createJobTemplate(
          templateRequest
        );
        logger.info(`Created custom template: ${jobTemplate.name}`);
        return customTemplateId;
      } catch (createError) {
        logger.error("Error creating custom template", createError);
        return "preset/web-hd";
      }
    } else {
      logger.error("Error checking template existence", error);
      throw error;
    }
  } finally {
    return customTemplateId;
  }
}

async function createVideoTranscoderJob(video) {
  try {
    const remoteFile = bucket.file(video.filename);
    const inputUri = remoteFile.cloudStorageURI.href;
    const outputUri = `${process.env.STORAGE_BUCKET}/transcoded/${video.filename}/`;

    // Create the transcoder job using the custom template
    const customTemplateId = await _getVideoTranscoderJobTemplateId();
    const jobRequest = {
      parent: transcoderServiceClient.locationPath(projectId, location),
      job: {
        inputUri: inputUri,
        outputUri: outputUri,
        templateId: customTemplateId,
      },
    };

    const [response] = await transcoderServiceClient.createJob(jobRequest);
    const jobId = response.name.split("/").pop();

    // Update the video document with the job ID
    await Video.findByIdAndUpdate(video._id, {
      jobId: jobId,
    });

    logger.info(`Video transcode job created with ID: ${jobId}`);
  } catch (error) {
    logger.error("Error creating transcode job", error);
    throw error;
  }
}

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
