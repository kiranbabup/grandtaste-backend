import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin if credentials are provided in .env
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    }
  } catch (error) {
    console.error("Firebase Initialization Error. Check FIREBASE_SERVICE_ACCOUNT JSON string in .env", error);
  }
}

export const uploadToFirebase = async (fileBuffer, originalname, mimetype) => {
  if (!admin.apps.length || !process.env.FIREBASE_STORAGE_BUCKET) {
    throw new Error("Firebase Admin is not configured. Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_STORAGE_BUCKET.");
  }

  const bucket = admin.storage().bucket();
  const ext = originalname.split('.').pop();
  const safeName = originalname.replace(/[^a-zA-Z0-9.]/g, '_');
  const filename = `products/${Date.now()}-${safeName}`;
  const file = bucket.file(filename);

  await file.save(fileBuffer, {
    metadata: { contentType: mimetype },
    public: true // Automatically makes the file publicly readable
  });

  // Return the public download URL
  return file.publicUrl();
};
