import server from '../lib/server.cjs';

const {
  configureCors,
  json,
  requireOwner,
  imageKitSecrets,
  signUpload,
} = server;

export default async function handler(req, res) {
  if (!configureCors(req, res)) return;

  try {
    await requireOwner(req);
    const { privateKey, publicKey } = imageKitSecrets({ needPublicKey: true });
    const auth = signUpload(privateKey);
    return json(res, 200, { ...auth, publicKey, folder: '/catatan-ayah' });
  } catch (error) {
    const code = String(error?.message || 'IMAGEKIT_AUTH_FAILED');
    const status = Number(error?.status) || (code === 'OWNER_ONLY' ? 403 : code === 'AUTH_REQUIRED' ? 401 : 500);
    // Never return secret values, service-account details, or SDK errors to the client.
    const safeCodes = new Set([
      'AUTH_REQUIRED',
      'OWNER_ONLY',
      'OWNER_UID_MISSING',
      'FIREBASE_ADMIN_CONFIG_MISSING',
      'IMAGEKIT_PRIVATE_KEY_MISSING',
      'IMAGEKIT_PUBLIC_KEY_MISSING',
      'IMAGEKIT_URL_ENDPOINT_MISSING',
    ]);
    return json(res, status, { error: safeCodes.has(code) ? code : 'IMAGEKIT_AUTH_FAILED' });
  }
}
