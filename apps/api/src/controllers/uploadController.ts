import { Request, Response } from 'express';
import path from 'path';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided. Field name must be "image".',
      });
    }

    // The public API may be configured as either https://api.gas-mobil.com
    // or https://api.gas-mobil.com/api. Uploaded files are served from /uploads,
    // not /api/uploads, so use only the configured origin.
    const configuredUrl = process.env.API_PUBLIC_URL?.trim();
    const forwardedProtocol = req.headers["x-forwarded-proto"];
    const forwardedHost = req.headers["x-forwarded-host"];
    const protocol = (Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol)?.split(",")[0]?.trim() || req.protocol;
    const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost)?.split(",")[0]?.trim() || req.get("host");
    const baseUrl = configuredUrl
      ? new URL(configuredUrl).origin
      : `${protocol}://${host}`;

    const relativePath = `/uploads/products/${path.basename(req.file.path)}`;
    const imageUrl = `${baseUrl}${relativePath}`;

    res.json({
      success: true,
      data: { imageUrl },
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image',
    });
  }
};