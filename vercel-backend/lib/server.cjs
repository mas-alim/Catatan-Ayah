const crypto = require('node:crypto');
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(status).json(body);
}

function configureCors(req, res) {
  const allowedOrigin = String(process.env.ALLOWED_ORIGIN || 'https://mas-alim.github.io').trim();
  const origin = String(req.headers.origin || '').trim();
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (origin && origin !== allowedOrigin) {
    json(res, 403, { error: 'ORIGIN_NOT_ALLOWED' });
    return false;
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    return false;
  }
  return true;
}

function adminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    const error = new Error('FIREBASE_ADMIN_CONFIG_MISSING');
    error.status = 500;
    throw error;
  }

  let app = getApps().find((item) => item.name === '[DEFAULT]');
  if (!app) {
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }
  return getAuth(app);
}

async function requireOwner(req) {
  const expectedUid = String(process.env.OWNER_UID || '').trim();
  if (!expectedUid) {
    const error = new Error('OWNER_UID_MISSING');
    error.status = 500;
    throw error;
  }

  const authHeader = String(req.headers.authorization || '');
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error('AUTH_REQUIRED');
    error.status = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(match[1], true);
  } catch {
    const error = new Error('AUTH_REQUIRED');
    error.status = 401;
    throw error;
  }
  if (decoded.uid !== expectedUid) {
    const error = new Error('OWNER_ONLY');
    error.status = 403;
    throw error;
  }
  return decoded;
}

function imageKitSecrets({ needPublicKey = false, needEndpoint = false } = {}) {
  const privateKey = String(process.env.IMAGEKIT_PRIVATE_KEY || '').trim();
  const publicKey = String(process.env.IMAGEKIT_PUBLIC_KEY || '').trim();
  const urlEndpoint = String(process.env.IMAGEKIT_URL_ENDPOINT || '').trim().replace(/\/+$/, '');
  if (!privateKey) {
    const error = new Error('IMAGEKIT_PRIVATE_KEY_MISSING');
    error.status = 500;
    throw error;
  }
  if (needPublicKey && !publicKey) {
    const error = new Error('IMAGEKIT_PUBLIC_KEY_MISSING');
    error.status = 500;
    throw error;
  }
  if (needEndpoint) {
    if (!urlEndpoint) {
      const error = new Error('IMAGEKIT_URL_ENDPOINT_MISSING');
      error.status = 500;
      throw error;
    }
    let parsed;
    try {
      parsed = new URL(urlEndpoint);
    } catch {
      parsed = null;
    }
    if (!parsed || parsed.protocol !== 'https:' || parsed.search || parsed.hash) {
      const error = new Error('IMAGEKIT_URL_ENDPOINT_INVALID');
      error.status = 500;
      throw error;
    }
  }
  return { privateKey, publicKey, urlEndpoint };
}

function signUpload(privateKey) {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 300;
  const signature = crypto.createHmac('sha1', privateKey).update(`${token}${expire}`).digest('hex');
  return { token, expire, signature };
}

function signPrivatePhotoPath(filePath, privateKey, urlEndpoint) {
  const path = String(filePath || '');
  if (!/^\/catatan-ayah\/[A-Za-z0-9._/-]{1,240}$/.test(path) || path.includes('..') || path.includes('//') || path.includes('\\')) {
    const error = new Error('PHOTO_PATH_INVALID');
    error.status = 400;
    throw error;
  }
  const expire = Math.floor(Date.now() / 1000) + 300;
  const signature = crypto.createHmac('sha1', privateKey).update(`${path.slice(1)}${expire}`).digest('hex');
  return { url: `${urlEndpoint}${path}?ik-t=${expire}&ik-s=${signature}`, expiresAt: expire };
}

module.exports = {
  configureCors,
  json,
  requireOwner,
  imageKitSecrets,
  signUpload,
  signPrivatePhotoPath,
};
