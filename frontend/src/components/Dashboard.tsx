import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import {
  Image as ImageIcon,
  Psychology as PsychologyIcon,
  Folder as FolderIcon,
  CloudDownload as CloudDownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorAlert from './common/ErrorAlert';

interface DashboardStats {
  assets: {
    total: number;
    images: number;
    audio: number;
  };
  prompts: {
    total: number;
    images: number;
    audio: number;
  };
  projects: number;
  executions: {
    total: number;
    completed: number;
    failed: number;
  };
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const [assetsRes, promptsRes, projectsRes] = await Promise.all([
    api.get('/assets?limit=1'),
    api.get('/prompts?limit=1'),
    api.get('/projects?limit=1'),
  ]);

  // This is a simplified version. In a real app, you'd have a dedicated stats endpoint
  return {
    assets: {
      total: assetsRes.data.total || 0,
      images: 0, // Would need filtering by type
      audio: 0,
    },
    prompts: {
      total: promptsRes.data.total || 0,
      images: 0,
      audio: 0,
    },
    projects: projectsRes.data.total || 0,
    executions: {
      total: 0,
      completed: 0,
      failed: 0,
    },
  };
};

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorAlert error={error} />;

  const statCards = [
    {
      title: 'Total Assets',
      value: stats?.assets.total || 0,
      icon: <ImageIcon fontSize="large" />,
      color: '#2196f3',
    },
    {
      title: 'Prompts',
      value: stats?.prompts.total || 0,
      icon: <PsychologyIcon fontSize="large" />,
      color: '#4caf50',
    },
    {
      title: 'Projects',
      value: stats?.projects || 0,
      icon: <FolderIcon fontSize="large" />,
      color: '#ff9800',
    },
    {
      title: 'Generations',
      value: stats?.executions.total || 0,
      icon: <CloudDownloadIcon fontSize="large" />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography color="textSecondary">
              No recent activity to display. Start by creating some assets or prompts!
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}