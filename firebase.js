const admin = require("firebase-admin");
const logger = require("./logger");

const setupFirebase = () => {
  try {
    const serviceAccount = process.env.VERCEL
      ? JSON.parse(
          Buffer.from(process.env.SERVICE_ACCOUNT_KEY, "base64").toString()
        )
      : require("./service-account-key.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.STORAGE_BUCKET,
      databaseURL: process.env.RTDB_URL,
    });
    logger.info("Firebase initialization successfully");
  } catch (error) {
    logger.error("Firebase initialization failed:", error);
  }
};

setupFirebase();
const Firestore = admin.firestore();

const FirebaseStorage = admin.storage();

const FirebaseAuth = admin.auth();

const FirebaseRealtimeDatabase = admin.database();

module.exports = {
  FirebaseAuth,
  Firestore,
  FirebaseStorage,
  FirebaseRealtimeDatabase,
};
