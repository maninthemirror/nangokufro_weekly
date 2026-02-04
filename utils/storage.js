// firebase
import admin from "firebase-admin";
import { firebaseConfig } from "./firebaseConfig.js";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    databaseURL: firebaseConfig.databaseURL
  });
}

const bucket = admin.storage().bucket();

export async function readJson(path) {
  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) return null;

  const [buf] = await file.download();
  return JSON.parse(buf.toString("utf-8"));
}

export async function writeJson(path, data) {
  const file = bucket.file(path);
  await file.save(JSON.stringify(data, null, 2), {
    contentType: "application/json",
  });
}