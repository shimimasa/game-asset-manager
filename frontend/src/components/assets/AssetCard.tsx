import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AudioFile as AudioFileIcon,
} from '@mui/icons-material';
import { Asset } from '../../types';
import LazyImage from '../common/LazyImage';

interface AssetCardProps {
  asset: Asset;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onSelect?: (asset: Asset) => void;
  selected?: boolean;
}

export default function AssetCard({ asset, onEdit, onDelete, onSelect, selected }: AssetCardProps) {
  const isImage = asset.fileType === 'IMAGE';
  const fileSize = (asset.fileSize / 1024 / 1024).toFixed(2);

  const handleDownload = () => {
    window.open(asset.storageUrl, '_blank');
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onSelect ? 'pointer' : 'default',
        border: selected ? 2 : 0,
        borderColor: 'primary.main',
      }}
      onClick={() => onSelect?.(asset)}
    >
      {isImage ? (
        <LazyImage
          src={asset.thumbnailUrl || asset.storageUrl}
          alt={asset.filename}
          height={200}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.100',
          }}
        >
          <AudioFileIcon sx={{ fontSize: 80, color: 'grey.400' }} />
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Tooltip title={asset.filename}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {asset.filename}
          </Typography>
        </Tooltip>
        <Typography variant="body2" color="text.secondary">
          {fileSize} MB • {asset.fileType}
        </Typography>
        {asset.metadata?.duration && (
          <Typography variant="body2" color="text.secondary">
            Duration: {Math.floor(asset.metadata.duration / 60)}:{String(asset.metadata.duration % 60).padStart(2, '0')}
          </Typography>
        )}
        <Box mt={1}>
          {asset.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </CardContent>
      <CardActions>
        <Tooltip title="Download">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        {onEdit && (
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(asset); }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(asset); }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}