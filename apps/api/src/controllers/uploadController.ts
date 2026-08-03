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

    // Construct the public URL
    const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
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
