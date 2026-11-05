import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Box, Button, CircularProgress, Typography, IconButton } from "@mui/material";
import { CloudUpload, Delete, Image as ImageIcon } from "@mui/icons-material";
import api from "../services/api";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  token: string;
}

function verifyImageUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = "";
      reject(new Error("The uploaded image could not be reached. Check the API public URL and upload storage."));
    }, 15000);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("The server saved the image but its public URL returned an error. Check API static-file routing and persistent storage."));
    };
    image.src = url;
  });
}

export default function ImageUpload({ value, onChange, label = "Product Image", token }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const [localPreview, setLocalPreview] = useState("");
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || "");
    setUploadError("");
  }, [value]);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG and WebP images are supported.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image exceeds the 5 MB limit. Choose a smaller image.");
      event.target.value = "";
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setLocalPreview(dataUrl);
      setPreview(dataUrl);
    };
    reader.onerror = () => setUploadError("Could not read the selected image.");
    reader.readAsDataURL(file);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file, file.name);

      const response = await api.post(API_URL + "/upload", formData, {
        headers: token ? { Authorization: "Bearer " + token } : undefined,
        timeout: 120000,
      });

      const imageUrl = response.data?.data?.imageUrl;
      if (!response.data?.success || typeof imageUrl !== "string" || !imageUrl.trim()) {
        throw new Error(response.data?.error || "The upload endpoint did not return an image URL.");
      }

      // Do not save a URL to the product form until the API's public static
      // image route has been verified to return the uploaded file.
      await verifyImageUrl(imageUrl);
      setPreview(imageUrl);
      setLocalPreview("");
      onChange(imageUrl);
      setUploadError("");
    } catch (error: any) {
      console.error("[GasMobil image upload]", error);
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;
      const friendly = status === 401
        ? "Your session expired. Sign in again and retry the upload."
        : status === 413
          ? "Image exceeds the server upload limit."
          : status === 404
            ? "The upload endpoint or public image route was not found. Check the API deployment."
            : status >= 500
              ? "The image service failed. Check API logs and upload-directory permissions."
              : message || "Image upload failed. Please retry.";
      setUploadError(friendly);
      // Keep the local preview for the user, but never submit its data URL as
      // the product image URL. The form keeps its previous persisted value.
      setPreview(localPreview || "");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setPreview("");
    setLocalPreview("");
    setUploadError("");
    onChange("");
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>{label}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        {preview ? (
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <img
              src={preview}
              alt="Product preview"
              style={{ width: 120, height: 120, objectFit: "contain", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff" }}
              onError={() => {
                if (!preview.startsWith("data:")) {
                  setUploadError("This saved image URL is unavailable. Re-upload the image or check the API storage volume.");
                }
              }}
            />
            <IconButton size="small" aria-label="Remove product image" onClick={removeImage}
              sx={{ position: "absolute", top: -8, right: -8, bgcolor: "error.main", color: "#fff", "&:hover": { bgcolor: "error.dark" } }}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
            sx={{ width: 120, height: 120, border: "2px dashed #b8c5bf", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" } }}>
            <ImageIcon color="disabled" sx={{ fontSize: 32, mb: 0.5 }} />
            <Typography variant="caption" color="text.secondary">Select image</Typography>
          </Box>
        )}
        <Box>
          <Button variant="outlined" size="small" startIcon={loading ? <CircularProgress size={16} /> : <CloudUpload />}
            onClick={() => inputRef.current?.click()} disabled={loading}>
            {loading ? "Uploading and verifying…" : preview ? "Replace image" : "Upload image"}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>JPG, PNG or WebP · Maximum 5 MB</Typography>
        </Box>
      </Box>
      {uploadError && <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>{uploadError}</Typography>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileSelect} />
    </Box>
  );
}
