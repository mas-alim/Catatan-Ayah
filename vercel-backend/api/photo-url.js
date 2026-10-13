import server from '../lib/server.cjs';

const {
  configureCors,
  json,
  requireOwner,
  imageKitSecrets,
  signPrivatePhotoPath,
} = server;

export default async function handler(req, res) {
  if (!configureCors(req, res)) return;

  try {
    await requireOwner(req);
    const filePath = String(req.body?.filePath || '');
    const { privateKey, urlEndpoint } = imageKitSecrets({ needEndpoint: true });
    const signed = signPrivatePhotoPath(filePath, privateKey, urlEndpoint);
    return json(res, 200, signed);
  } catch (error) {
    const code = String(error?.message || 'IMAGEKIT_URL_FAILED');
    const status = Number(error?.status) || (code === 'OWNER_ONLY' ? 403 : code === 'AUTH_REQUIRED' ? 401 : 500);
    const safeCodes = new Set([
      'AUTH_REQUIRED',
      'OWNER_ONLY',
      'OWNER_UID_MISSING',
      'FIREBASE_ADMIN_CONFIG_MISSING',
      'IMAGEKIT_PRIVATE_KEY_MISSING',
      'IMAGEKIT_URL_ENDPOINT_MISSING',
      'IMAGEKIT_URL_ENDPOINT_INVALID',
      'PHOTO_PATH_INVALID',
    ]);
    return json(res, status, { error: safeCodes.has(code) ? code : 'IMAGEKIT_URL_FAILED' });
  }
}
