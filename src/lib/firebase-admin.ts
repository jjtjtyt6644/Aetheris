import * as admin from "firebase-admin";

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountStr) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY is missing from environment variables.");
    throw new Error("Missing Firebase Service Account Key");
  }

  try {
    // Some env parsers keep surrounding quotes securely, so remove them if present
    const cleanStr = serviceAccountStr.replace(/^'|'$/g, "");
    const serviceAccount = JSON.parse(cleanStr);
    
    // PEM formatted keys must have literal newlines, but sometimes env strings have escaped \\n.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase admin initialization failed:", error);
    throw error;
  }
}

export const adminDb = () => getAdminApp().firestore();
export const adminAuth = () => getAdminApp().auth();
