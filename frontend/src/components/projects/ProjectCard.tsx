import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onDuplicate?: (project: Project) => void;
  onClick?: (project: Project) => void;
}

export default function ProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onClick 
}: ProjectCardProps) {
  const assetCount = project._count?.assets || 0;

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: 3,
        } : {},
      }}
      onClick={() => onClick?.(project)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FolderIcon color="primary" sx={{ fontSize: 40 }} />
          <Box flexGrow={1}>
            <Typography variant="h6" component="div" noWrap>
              {project.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        {project.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              height: '2.5em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {project.description}
          </Typography>
        )}

        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            icon={<ImageIcon />} 
            label={`${assetCount} assets`} 
            size="small" 
            variant="outlined"
          />
        </Box>
      </CardContent>
      
      <CardActions>
        {onEdit && (
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={(e) => { 
                e.stopPropagation(); 
                onEdit(project); 
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {onDuplicate && (
          <Tooltip title="Duplicate">
            <IconButton 
              size="small" 
              onClick={(e) => { 
                e.stopPropagation(); 
                onDuplicate(project); 
              }}
            >
              <CopyIcon />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              onClick={(e) => { 
                e.stopPropagation(); 
                onDelete(project); 
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}