'use client';

import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadApi } from '@/lib/api/upload';
import { getApiErrorMessage } from '@/lib/api-client';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: 'dishes' | 'canteens';
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export function ImageUploadField({
  label,
  value = '',
  onChange,
  folder = 'dishes',
  hint,
  error,
  disabled = false,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Basic client validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Please select an image (JPEG, PNG, WebP, or GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadApi.uploadImage(file, folder);
      onChange(url);
      toast.success('Photo uploaded successfully!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to upload photo'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-ink">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-muted hover:text-accent transition-colors"
        >
          {showUrlInput ? 'Hide URL input' : 'Or paste image URL'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
      />

      {/* Upload & Preview area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all ${
          dragActive
            ? 'border-accent bg-accent/5'
            : value
            ? 'border-line bg-surface/50'
            : 'border-line/70 hover:border-accent/60 bg-surface/20'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {value ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Uploaded preview"
                className="h-full w-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center sm:items-start gap-1">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                ✓ Photo uploaded
              </span>
              <p className="text-xs text-muted truncate max-w-xs">{value}</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
                >
                  Change photo
                </button>
                <span className="text-xs text-muted">•</span>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  disabled={disabled || isUploading}
                  className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-2">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-accent border-t-transparent" />
                <span className="text-xs font-medium text-ink">Uploading to cloud...</span>
              </div>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-tint text-accent mb-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    Click to upload
                  </button>
                  <span className="text-sm text-muted">or drag & drop</span>
                </div>
                <p className="text-xs text-muted mt-1">PNG, JPG, WebP up to 5MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Manual URL input fallback if requested */}
      {showUrlInput && (
        <div className="mt-2 space-y-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="input text-xs"
            disabled={disabled || isUploading}
          />
          <p className="text-xs text-muted">Direct link to an external image</p>
        </div>
      )}

      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
