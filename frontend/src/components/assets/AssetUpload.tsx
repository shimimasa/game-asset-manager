import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  TextField,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { assetService } from '../../services/assetService';

interface AssetUploadProps {
  onUploadComplete?: () => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function AssetUpload({ onUploadComplete }: AssetUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status !== 'pending') continue;

      // Update status to uploading
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' } : f
      ));

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
          ));
        }, 200);

        await assetService.uploadAsset(uploadFile.file, { tags, category });

        clearInterval(progressInterval);

        // Update to success
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success', progress: 100 } : f
        ));
      } catch (error: any) {
        // Update to error
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            error: error.message || 'Upload failed' 
          } : f
        ));
      }
    }

    onUploadComplete?.();
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const canUpload = files.some(f => f.status === 'pending');

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files (Images and Audio, max 50MB)
        </Typography>
      </Paper>

      {files.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Files to Upload
          </Typography>
          {files.map((uploadFile, index) => (
            <Box key={index} mb={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                  {uploadFile.file.name}
                </Typography>
                {uploadFile.status === 'pending' && (
                  <IconButton size="small" onClick={() => handleRemoveFile(index)}>
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
              {uploadFile.status === 'uploading' && (
                <LinearProgress variant="determinate" value={uploadFile.progress} />
              )}
              {uploadFile.status === 'success' && (
                <Alert severity="success" sx={{ mt: 1 }}>Upload successful!</Alert>
              )}
              {uploadFile.status === 'error' && (
                <Alert severity="error" sx={{ mt: 1 }}>{uploadFile.error}</Alert>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Box mt={3}>
        <TextField
          fullWidth
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          margin="normal"
        />
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>Tags</Typography>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <TextField
              size="small"
              placeholder="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <IconButton onClick={handleAddTag} size="small">
              <AddIcon />
            </IconButton>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                size="small"
              />
            ))}
          </Box>
        </Box>
      </Box>

      {canUpload && (
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={handleUpload}
          startIcon={<CloudUploadIcon />}
        >
          Upload Files
        </Button>
      )}
    </Box>
  );
}