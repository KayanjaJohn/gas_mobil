import { useState, useRef, ChangeEvent } from 'react';
import { Box, Button, CircularProgress, Typography, IconButton } from '@mui/material';
import { CloudUpload, Delete, Image as ImageIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  token: string;
}

export default function ImageUpload({ value, onChange, label = "Product Image", token }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate before upload
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success && res.data.data?.imageUrl) {
        onChange(res.data.data.imageUrl);
        setPreview(res.data.data.imageUrl);
      } else {
        throw new Error(res.data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to upload image';
      alert(msg);
      setPreview(value);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    setPreview('');
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
      </Typography>

      {preview ? (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: 120,
              height: 120,
              objectFit: 'cover',
              borderRadius: 12,
              border: '2px solid #e0e0e0',
            }}
          />
          <IconButton
            size="small"
            onClick={handleRemove}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: '#ff4444',
              color: '#fff',
              '&:hover': { bgcolor: '#cc0000' },
              width: 28,
              height: 28,
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          component="label"
          startIcon={loading ? <CircularProgress size={18} /> : <CloudUpload />}
          disabled={loading}
          sx={{
            width: 120,
            height: 120,
            borderRadius: 3,
            borderStyle: 'dashed',
            borderWidth: 2,
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {loading ? 'Uploading...' : (
            <>
              <ImageIcon />
              <Typography variant="caption">Click to upload</Typography>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleFileSelect}
          />
        </Button>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        JPG, PNG, WebP. Max 5MB.
      </Typography>
    </Box>
  );
}
