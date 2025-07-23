import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  TextField,
  IconButton,
  Grid,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Asset } from '../../types';
import { assetService } from '../../services/assetService';

interface AssetDetailProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (asset: Asset) => void;
}

export default function AssetDetail({ asset, open, onClose, onUpdate }: AssetDetailProps) {
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('');

  React.useEffect(() => {
    if (asset) {
      setTags(asset.tags);
      setCategory(asset.category || '');
    }
  }, [asset]);

  if (!asset) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    try {
      const updated = await assetService.updateAsset(asset.id, { tags, category });
      onUpdate?.(updated);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handleDownload = () => {
    window.open(asset.storageUrl, '_blank');
  };

  const isImage = asset.fileType === 'IMAGE';
  const fileSize = (asset.fileSize / 1024 / 1024).toFixed(2);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{asset.filename}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {isImage ? (
              <Box
                component="img"
                src={asset.storageUrl}
                alt={asset.filename}
                sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Audio File
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">File Information</Typography>
            <Box mb={2}>
              <Typography variant="body2">Type: {asset.fileType}</Typography>
              <Typography variant="body2">Size: {fileSize} MB</Typography>
              <Typography variant="body2">Format: {asset.mimeType}</Typography>
              {asset.metadata?.width && (
                <Typography variant="body2">
                  Dimensions: {asset.metadata.width} × {asset.metadata.height}
                </Typography>
              )}
              {asset.metadata?.duration && (
                <Typography variant="body2">
                  Duration: {Math.floor(asset.metadata.duration / 60)}:{String(asset.metadata.duration % 60).padStart(2, '0')}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Category</Typography>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                margin="dense"
              />
            ) : (
              <Typography variant="body2" gutterBottom>
                {category || 'No category'}
              </Typography>
            )}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>Tags</Typography>
            {editing ? (
              <Box>
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
            ) : (
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <Chip key={tag} label={tag} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No tags</Typography>
                )}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Created</Typography>
            <Typography variant="body2">
              {new Date(asset.createdAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDownload} startIcon={<DownloadIcon />}>
          Download
        </Button>
        {editing ? (
          <>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">Save</Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)} variant="contained">Edit</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}