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

    // ── FIX: Use API_PUBLIC_URL for production; fallback to host header for proxies ──
    // API_PUBLIC_URL should be the public-facing URL like https://api.gasmobil.ug
    const publicUrl = process.env.API_PUBLIC_URL;
    let baseUrl: string;

    if (publicUrl) {
      baseUrl = publicUrl.replace(/\/$/, ''); // trim trailing slash
    } else {
      // In dev or when no public URL is set, use the request's host header
      // This respects reverse proxies (Nginx, CloudFlare, etc.)
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.headers.host || req.get('host');
      baseUrl = `${protocol}://${host}`;
    }

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