// firebase
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
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