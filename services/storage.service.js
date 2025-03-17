const { v4: uuidv4 } = require("uuid");
const { FirebaseStorage } = require("../firebase");
const fs = require("fs");
const bucket = FirebaseStorage.bucket();

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

    console.log("File uploaded to Firebase");
    return { url: downloadUrl, filename: uuid };
  } catch (err) {
    console.error("Error uploading to Firebase:", err);
    throw new Error("Firebase upload failed");
  }
};

const deleteFromFirebaseStorage = async (filename) => {
  try {
    const fileRef = bucket.file(filename);
    await fileRef.delete();
    console.log(`File ${filename} deleted successfully from Firebase`);
  } catch (error) {
    console.error("Error deleting file from Firebase:", error);
  }
};

module.exports = { deleteFromFirebaseStorage, uploadToFirebaseStorage };
