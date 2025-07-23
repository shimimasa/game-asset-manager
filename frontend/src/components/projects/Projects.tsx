import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, ProjectFilters } from '../../services/projectService';
import { Project, CreateProjectData } from '../../types';
import ProjectCard from './ProjectCard';
import ProjectEditor from './ProjectEditor';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import ConfirmDialog from '../common/ConfirmDialog';

const ITEMS_PER_PAGE = 12;

export default function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProjectFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
    orderBy: 'createdAt',
    order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  // Fetch projects
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectService.getProjects(filters),
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProjectData) => projectService.createProject(data),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditorOpen(false);
      navigate(`/projects/${newProject.id}`);
    },
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateProjectData }) =>
      projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditorOpen(false);
      setEditingProject(null);
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteProject(null);
    },
  });

  // Duplicate project mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => projectService.duplicateProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchInput,
      offset: 0,
    });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({
      ...filters,
      search: undefined,
      offset: 0,
    });
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setFilters({
      ...filters,
      offset: (page - 1) * ITEMS_PER_PAGE,
    });
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setEditorOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditorOpen(true);
  };

  const handleSaveProject = (data: CreateProjectData) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;
  const currentPage = Math.floor(filters.offset / ITEMS_PER_PAGE) + 1;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
        >
          New Project
        </Button>
      </Box>

      {/* Search */}
      <Box mb={3}>
        <TextField
          placeholder="Search projects..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          fullWidth
        />
      </Box>

      {/* Projects grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading projects..." />
      ) : error ? (
        <ErrorAlert error={error} />
      ) : data?.data && data.data.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {data.data.map((project) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                <ProjectCard
                  project={project}
                  onClick={handleProjectClick}
                  onEdit={handleEditProject}
                  onDelete={setDeleteProject}
                  onDuplicate={(p) => duplicateMutation.mutate(p.id)}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create your first project to organize your game assets
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
          >
            Create Project
          </Button>
        </Box>
      )}

      {/* Project editor */}
      <ProjectEditor
        open={editorOpen}
        project={editingProject}
        onClose={() => {
          setEditorOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteProject?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => deleteProject && deleteMutation.mutate(deleteProject.id)}
        onCancel={() => setDeleteProject(null)}
      />
    </Box>
  );
}