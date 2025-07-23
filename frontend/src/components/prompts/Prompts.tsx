import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService, PromptFilters } from '../../services/promptService';
import { Prompt, CreatePromptData } from '../../types';
import PromptCard from './PromptCard';
import PromptEditor from './PromptEditor';
import PromptExecutor from './PromptExecutor';
import ExecutionHistory from './ExecutionHistory';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import ConfirmDialog from '../common/ConfirmDialog';

const ITEMS_PER_PAGE = 12;

export default function Prompts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PromptFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [executorOpen, setExecutorOpen] = useState(false);
  const [executePrompt, setExecutePrompt] = useState<Prompt | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPromptId, setHistoryPromptId] = useState<string | undefined>();
  const [deletePrompt, setDeletePrompt] = useState<Prompt | null>(null);

  // Fetch prompts
  const { data, isLoading, error } = useQuery({
    queryKey: ['prompts', filters],
    queryFn: () => promptService.getPrompts(filters),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; data: CreatePromptData }) => 
      data.id 
        ? promptService.updatePrompt(data.id, data.data)
        : promptService.createPrompt(data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setEditorOpen(false);
      setSelectedPrompt(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => promptService.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setDeletePrompt(null);
    },
  });

  // Clone mutation
  const cloneMutation = useMutation({
    mutationFn: (id: string) => promptService.clonePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchInput,
      offset: 0,
    });
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({
      ...filters,
      search: undefined,
      offset: 0,
    });
    setPage(1);
  };

  const handleTypeChange = (type: string) => {
    setFilters({
      ...filters,
      type: type as 'IMAGE' | 'AUDIO' | undefined,
      offset: 0,
    });
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    setFilters({
      ...filters,
      offset: (value - 1) * ITEMS_PER_PAGE,
    });
  };

  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditorOpen(true);
  };

  const handleExecute = (prompt: Prompt) => {
    setExecutePrompt(prompt);
    setExecutorOpen(true);
  };

  const handleShowHistory = (prompt?: Prompt) => {
    setHistoryPromptId(prompt?.id);
    setHistoryOpen(true);
  };

  const handleSave = (data: CreatePromptData) => {
    saveMutation.mutate({
      id: selectedPrompt?.id,
      data,
    });
  };

  if (isLoading) return <LoadingSpinner message="Loading prompts..." />;
  if (error) return <ErrorAlert error={error} />;

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 1;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Prompts</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => handleShowHistory()}
          >
            All History
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedPrompt(null);
              setEditorOpen(true);
            }}
          >
            Create Prompt
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <TextField
          placeholder="Search prompts..."
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
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.type || ''}
            onChange={(e) => handleTypeChange(e.target.value)}
            label="Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="IMAGE">Image</MenuItem>
            <MenuItem value="AUDIO">Audio</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, value) => value && setViewMode(value)}
          size="small"
        >
          <ToggleButton value="grid">
            <GridIcon />
          </ToggleButton>
          <ToggleButton value="list">
            <ListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" mb={2}>
        {data?.total || 0} prompts found
      </Typography>

      {/* Prompts grid/list */}
      {data?.prompts && data.prompts.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {data.prompts.map((prompt) => (
              <Grid 
                item 
                xs={12} 
                sm={viewMode === 'grid' ? 6 : 12} 
                md={viewMode === 'grid' ? 4 : 12} 
                key={prompt.id}
              >
                <PromptCard
                  prompt={prompt}
                  onEdit={handleEdit}
                  onDelete={setDeletePrompt}
                  onClone={(p) => cloneMutation.mutate(p.id)}
                  onExecute={handleExecute}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No prompts found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {filters.search ? 'Try adjusting your search criteria' : 'Create your first prompt to get started'}
          </Typography>
          {!filters.search && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedPrompt(null);
                setEditorOpen(true);
              }}
            >
              Create Prompt
            </Button>
          )}
        </Box>
      )}

      {/* Prompt editor */}
      <PromptEditor
        open={editorOpen}
        prompt={selectedPrompt}
        onClose={() => {
          setEditorOpen(false);
          setSelectedPrompt(null);
        }}
        onSave={handleSave}
      />

      {/* Prompt executor */}
      <PromptExecutor
        open={executorOpen}
        prompt={executePrompt}
        onClose={() => {
          setExecutorOpen(false);
          setExecutePrompt(null);
        }}
      />

      {/* Execution history */}
      <ExecutionHistory
        open={historyOpen}
        promptId={historyPromptId}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryPromptId(undefined);
        }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletePrompt}
        title="Delete Prompt"
        message={`Are you sure you want to delete "${deletePrompt?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => deletePrompt && deleteMutation.mutate(deletePrompt.id)}
        onCancel={() => setDeletePrompt(null)}
      />
    </Box>
  );
}