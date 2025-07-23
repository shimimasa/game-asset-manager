import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Breadcrumbs,
  Link,
  Paper,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/projectService';
import { Project, Asset } from '../../types';
import AssetCard from '../assets/AssetCard';
import AssetSelector from './AssetSelector';
import ProjectEditor from './ProjectEditor';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import ConfirmDialog from '../common/ConfirmDialog';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [removeAsset, setRemoveAsset] = useState<Asset | null>(null);

  // Fetch project
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  });

  // Fetch project assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['projectAssets', id],
    queryFn: () => projectService.getProjectAssets(id!, { limit: 100 }),
    enabled: !!id,
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Project>) => 
      projectService.updateProject(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setEditorOpen(false);
    },
  });

  // Add assets mutation
  const addAssetsMutation = useMutation({
    mutationFn: (assetIds: string[]) => 
      Promise.all(assetIds.map(assetId => 
        projectService.addAssetToProject(id!, assetId)
      )),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectAssets', id] });
      setSelectorOpen(false);
    },
  });

  // Remove asset mutation
  const removeAssetMutation = useMutation({
    mutationFn: (assetId: string) => 
      projectService.removeAssetFromProject(id!, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectAssets', id] });
      setRemoveAsset(null);
    },
  });

  const handleAddAssets = (assetIds: string[]) => {
    // Filter out already added assets
    const existingIds = new Set(assetsData?.assets.map(a => a.id) || []);
    const newAssetIds = assetIds.filter(id => !existingIds.has(id));
    
    if (newAssetIds.length > 0) {
      addAssetsMutation.mutate(newAssetIds);
    } else {
      setSelectorOpen(false);
    }
  };

  const handleExport = () => {
    navigate(`/export/project/${id}`);
  };

  if (projectLoading) return <LoadingSpinner message="Loading project..." />;
  if (projectError) return <ErrorAlert error={projectError} />;
  if (!project) return <ErrorAlert error="Project not found" />;

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/projects" color="inherit">
          Projects
        </Link>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/projects')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4">{project.name}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditorOpen(true)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Project info */}
      {project.description && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body1">{project.description}</Typography>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Assets section */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Project Assets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSelectorOpen(true)}
        >
          Add Assets
        </Button>
      </Box>

      {assetsLoading ? (
        <LoadingSpinner message="Loading assets..." />
      ) : assetsData?.assets && assetsData.assets.length > 0 ? (
        <Grid container spacing={3}>
          {assetsData.assets.map((asset) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
              <AssetCard
                asset={asset}
                onDelete={setRemoveAsset}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No assets in this project
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add assets to organize them in this project
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setSelectorOpen(true)}
          >
            Add Assets
          </Button>
        </Box>
      )}

      {/* Asset selector */}
      <AssetSelector
        open={selectorOpen}
        selectedAssets={assetsData?.assets.map(a => a.id) || []}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAddAssets}
      />

      {/* Project editor */}
      <ProjectEditor
        open={editorOpen}
        project={project}
        onClose={() => setEditorOpen(false)}
        onSave={(data) => updateMutation.mutate(data)}
      />

      {/* Remove asset confirmation */}
      <ConfirmDialog
        open={!!removeAsset}
        title="Remove Asset from Project"
        message={`Are you sure you want to remove "${removeAsset?.filename}" from this project? The asset itself will not be deleted.`}
        confirmText="Remove"
        onConfirm={() => removeAsset && removeAssetMutation.mutate(removeAsset.id)}
        onCancel={() => setRemoveAsset(null)}
      />
    </Box>
  );
}