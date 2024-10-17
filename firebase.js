const admin = require('firebase-admin');

const setupFirebase = () => {
    try {
        const serviceAccount = require('./service-account-key.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.STORAGE_BUCKET,
        });
        console.log("Firebase initialization successfully");
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
};

setupFirebase();
const Firestore = admin.firestore();

const FirebaseStorage = admin.storage();

const FirebaseAuth = admin.auth();

module.exports = { FirebaseAuth, Firestore, FirebaseStorage };