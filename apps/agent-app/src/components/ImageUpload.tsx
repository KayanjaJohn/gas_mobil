import { useState, useRef, ChangeEvent, useEffect } from 'react';
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
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── FIX: Sync preview when value prop changes (e.g., dialog reopen, edit different product) ──
  useEffect(() => {
    setPreview(value);
    setUploadError('');
  }, [value]);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate before upload
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Max 5MB.');
      return;
    }

    setUploadError('');

    // Local preview (base64) — shows immediately
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
        const imageUrl = res.data.data.imageUrl;
        onChange(imageUrl);
        // Keep base64 preview until we verify the server URL loads
        // We'll switch to server URL after a brief delay to avoid flicker
        setTimeout(() => setPreview(imageUrl), 300);
      } else {
        throw new Error(res.data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to upload image';
      setUploadError(msg);
      // Keep the base64 preview on error so user still sees something
      // Don't reset to empty — user can retry or remove manually
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    setPreview('');
    setUploadError('');
  };

  const isBase64 = preview?.startsWith('data:');

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
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
              borderRadius: 8,
              border: '1px solid #e0e0e0',
            }}
            onError={() => {
              // If server URL fails to load, show error and fallback
              if (!isBase64) {
                setUploadError('Image URL failed to load. Please re-upload.');
                setPreview('');
              }
            }}
          />
          <IconButton
            size="small"
            onClick={handleRemove}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'error.main',
              color: '#fff',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
          {isBase64 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'warning.main' }}>
              Uploading...
            </Typography>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            width: 120,
            height: 120,
            border: '2px dashed #ccc',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon color="disabled" sx={{ fontSize: 32, mb: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            Click to upload
          </Typography>
        </Box>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {!preview && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<CloudUpload />}
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          sx={{ mt: 1 }}
        >
          {loading ? <CircularProgress size={16} /> : 'Upload Image'}
        </Button>
      )}

      {uploadError && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {uploadError}
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        JPG, PNG, WebP. Max 5MB.
      </Typography>
    </Box>
  );
}