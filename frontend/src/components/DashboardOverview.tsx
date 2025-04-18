import { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress,
  Tooltip,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  InfoOutlined,
  ArrowForward,
  Refresh,
  TrendingUp,
  SignalWifiOff,
  AccountBalance
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardMetrics {
  target_count: number;
  unavailable_isp: number;
  unavailable_mfi: number;
  last_updated?: string;
  trend?: {
    target_count: number;
    unavailable_isp: number;
    unavailable_mfi: number;
  };
}

const DashboardOverview = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    target_count: 0,
    unavailable_isp: 0,
    unavailable_mfi: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/dashboard-overview');
      if (response.data && typeof response.data === 'object') {
        setMetrics({
          target_count: Number(response.data.target_count) || 0,
          unavailable_isp: Number(response.data.unavailable_isp) || 0,
          unavailable_mfi: Number(response.data.unavailable_mfi) || 0,
          last_updated: response.data.last_updated || new Date().toISOString(),
          trend: response.data.trend || {
            target_count: 0,
            unavailable_isp: 0,
            unavailable_mfi: 0
          }
        });
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const renderTrendIndicator = (value: number) => {
    if (value === 0) return null;
    
    const isPositive = value > 0;
    const color = isPositive ? theme.palette.success.main : theme.palette.error.main;
    const icon = isPositive ? '↑' : '↓';
    
    return (
      <Typography 
        component="span" 
        sx={{ 
          color, 
          ml: 1,
          fontSize: '0.8rem',
          fontWeight: 500
        }}
      >
        {icon} {Math.abs(value)}%
      </Typography>
    );
  };

  if (loading && !isRefreshing) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        borderRadius: 2,
        p: 3,
        boxShadow: theme.shadows[2],
        border: `1px solid ${theme.palette.divider}`
      }}>
        <CircularProgress sx={{ color: theme.palette.primary.main, mb: 2 }} />
        <Typography sx={{ color: 'text.secondary' }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: 2,
          p: 3,
          boxShadow: theme.shadows[2],
          border: `1px solid ${theme.palette.divider}`
        }}>
          <Typography sx={{ color: theme.palette.error.main, textAlign: 'center', mb: 2 }}>
            Error: {error}
          </Typography>
          <IconButton 
            onClick={handleRefresh}
            color="primary"
            sx={{ mt: 1 }}
          >
            <Refresh />
            <Typography variant="body2" sx={{ ml: 1 }}>Retry</Typography>
          </IconButton>
        </Box>
      </motion.div>
    );
  }

  const metricCards = [
    {
      title: "Target Biller Count",
      value: metrics.target_count,
      description: "Number of billers we aim to onboard",
      icon: <TrendingUp fontSize="large" />,
      color: theme.palette.primary.main,
      trend: metrics.trend?.target_count,
      path: '/billers'
    },
    {
      title: "Unavailable ISP",
      value: metrics.unavailable_isp,
      description: "Number of ISPs not available on our platform",
      icon: <SignalWifiOff fontSize="large" />,
      color: theme.palette.warning.main,
      trend: metrics.trend?.unavailable_isp,
      path: '/unavailable-isp'
    },
    {
      title: "Unavailable MFI",
      value: metrics.unavailable_mfi,
      description: "Number of MFIs not available on our platform",
      icon: <AccountBalance fontSize="large" />,
      color: theme.palette.success.main,
      trend: metrics.trend?.unavailable_mfi,
      path: '/unavailable-mfi'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{
        mb: 4,
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        p: 3,
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        border: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="h5" component="h2" sx={{
            color: '#dc004e',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
          }}>
            Dashboard Overview
            <Tooltip title="Real-time metrics overview">
              <InfoOutlined sx={{ ml: 1, fontSize: '1rem', color: 'text.secondary' }} />
            </Tooltip>
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {metrics.last_updated && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mr: 2 }}>
                Updated: {new Date(metrics.last_updated).toLocaleTimeString()}
              </Typography>
            )}
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={handleRefresh} 
                size="small"
                disabled={isRefreshing}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <Refresh sx={{ 
                  fontSize: '1.2rem',
                  transition: 'transform 0.3s ease',
                  transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)'
                }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3} justifyContent="center" alignItems="stretch">
          {metricCards.map((card, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card sx={{
                  height: '100%',
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  boxShadow: theme.shadows[1],
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    borderColor: alpha(card.color, 0.5)
                  }
                }} onClick={() => handleCardClick(card.path)}>
                  <CardContent sx={{ position: 'relative' }}>
                    <Box sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      color: alpha(card.color, 0.2),
                      zIndex: 0
                    }}>
                      {card.icon}
                    </Box>
                    
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Typography 
                        sx={{ 
                          color: 'text.secondary',
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }} 
                        variant="subtitle1"
                      >
                        {card.title}
                        <Tooltip title={card.description}>
                          <InfoOutlined sx={{ 
                            ml: 1, 
                            fontSize: '1rem',
                            color: 'text.disabled'
                          }} />
                        </Tooltip>
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
                        <Typography 
                          variant="h3" 
                          component="div" 
                          sx={{ 
                            color: card.color, 
                            fontWeight: 'bold',
                            lineHeight: 1
                          }}
                        >
                          {card.value.toLocaleString()}
                        </Typography>
                        {card.trend !== undefined && renderTrendIndicator(card.trend)}
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary', 
                          mt: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {card.description}
                        <ArrowForward sx={{ 
                          ml: 'auto', 
                          fontSize: '1rem',
                          color: alpha(theme.palette.text.secondary, 0.5)
                        }} />
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <AnimatePresence>
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: alpha(theme.palette.background.default, 0.7),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
                borderRadius: 16
              }}
            >
              <CircularProgress color="primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
};

export default DashboardOverview;