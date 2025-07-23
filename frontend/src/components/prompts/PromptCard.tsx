import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import { Prompt } from '../../types';

interface PromptCardProps {
  prompt: Prompt;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onClone?: (prompt: Prompt) => void;
  onExecute?: (prompt: Prompt) => void;
}

export default function PromptCard({ prompt, onEdit, onDelete, onClone, onExecute }: PromptCardProps) {
  const isImage = prompt.type === 'IMAGE';
  const TypeIcon = isImage ? ImageIcon : AudioIcon;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <TypeIcon color="action" />
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
            {prompt.title}
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            height: '3em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {prompt.content}
        </Typography>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Chip 
            label={prompt.type} 
            size="small" 
            color={isImage ? 'primary' : 'secondary'}
          />
          <Typography variant="caption" color="text.secondary">
            Used {prompt.usageCount} times
          </Typography>
        </Box>

        {prompt.successRate > 0 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Success Rate
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {prompt.successRate}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={prompt.successRate} 
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        )}
      </CardContent>
      
      <CardActions>
        <Tooltip title="Execute">
          <IconButton size="small" onClick={() => onExecute?.(prompt)} color="primary">
            <PlayIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit?.(prompt)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clone">
          <IconButton size="small" onClick={() => onClone?.(prompt)}>
            <CopyIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete?.(prompt)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}