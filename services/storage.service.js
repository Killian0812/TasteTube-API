const { v4: uuidv4 } = require('uuid');
const { FirebaseStorage } = require('../firebase');
const bucket = FirebaseStorage.bucket();

const uploadToFirebaseStorage = async (file) => {
    try {
        const uuid = uuidv4();
        const remoteFile = bucket.file(uuid);

        await remoteFile.save(file.buffer, {
            contentType: file.mimetype,
            public: true,
        });

        const [downloadURL] = await remoteFile.getSignedUrl({
            action: 'read',
            expires: '01-01-3000'
        });

        console.log("File uploaded to Firebase");
        return { imageURL: downloadURL, filename: uuid };

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
        console.error('Error deleting file from Firebase:', error);
        throw new Error("Firebase delete failed");
    }
};

module.exports = { deleteFromFirebaseStorage, uploadToFirebaseStorage };