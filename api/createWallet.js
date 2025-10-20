import { ethers } from "ethers";
import admin from "firebase-admin";

// ---- Firebase init (ENV one-line JSON; fix \n) ----
if (!admin.apps.length) {
  const svc = JSON.parse(process.env.FIREBASE_KEY);
  svc.private_key = svc.private_key.replace(/\\n/g, "\n");
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}
const db = admin.firestore();

// ---- CORS so Unity/WebGL & browser can call ----
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // Support GET (?username=) and POST ({username})
    let username = "";
    if (req.method === "GET") {
      username = (req.query.username || req.query.user || "").toString().trim();
    } else if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      username = (body.username || "").toString().trim();
    } else {
      return res.status(405).json({ error: "Only GET/POST allowed" });
    }

    if (!username) return res.status(400).json({ error: "username required" });

    const key = username.toLowerCase();
    const docRef = db.collection("wallets").doc(key);
    const snap = await docRef.get();

    if (snap.exists) {
      const data = snap.data();
      return res.status(200).json({
        created: false,
        username: key,
        publicKey: data.publicKey,
        privateKey: data.privateKey, // ⚠️ dev only
        createdAt: data.createdAt
      });
    }

    // create new wallet
    const wallet = ethers.Wallet.createRandom();
    const record = {
      username: key,
      publicKey: wallet.address,
      privateKey: wallet.privateKey, // ⚠️ dev only
      createdAt: new Date().toISOString()
    };
    await docRef.set(record);

    return res.status(200).json({
      created: true,
      username: key,
      publicKey: record.publicKey,
      privateKey: record.privateKey
    });
  } catch (err) {
    console.error("createWallet error:", err);
    return res.status(500).json({ error: err.message || "internal error" });
  }
}
