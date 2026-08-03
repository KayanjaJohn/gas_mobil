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

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

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
        const fullUrl = res.data.data.imageUrl.startsWith('http')
          ? res.data.data.imageUrl
          : `${API_URL.replace('/api', '')}${res.data.data.imageUrl}`;
        onChange(fullUrl);
        setPreview(fullUrl);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err.response?.data?.error || 'Failed to upload image');
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
