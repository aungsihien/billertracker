import { Container, Typography, Box, Paper, AppBar, Toolbar, Button, CircularProgress, Drawer, List, ListItem, ListItemText, ListItemButton, ListItemIcon, IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../ThemeContext';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StarIcon from '@mui/icons-material/Star';
import DashboardOverview from './DashboardOverview';
import BillerStatusChart from './BillerStatusChart';
import Top50BillerChart from './Top50BillerChart';
import BillerList from './BillerList';
import UnavailableISPList from './UnavailableISPList';
import UnavailableMFIList from './UnavailableMFIList';
import Top50BillersList from './Top50BillersList';

const DRAWER_WIDTH = 240;

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/billers', label: 'Billers', icon: <ListAltIcon /> },
    { path: '/top-50-billers', label: 'Top 50 Billers', icon: <StarIcon /> },
    { path: '/unavailable-isp', label: 'Unavailable ISP', icon: <SignalWifiOffIcon /> },
    { path: '/unavailable-mfi', label: 'Unavailable MFI', icon: <AccountBalanceIcon /> },
  ];

  const { mode, toggleMode } = useThemeMode();
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" elevation={0} sx={{ 
        backgroundColor: 'background.paper', 
        borderBottom: 1, 
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`
      }}>
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton
  onClick={toggleMode}
  size="large"
  sx={{
    bgcolor: mode === 'light' ? 'primary.main' : '#ffe066',
    color: mode === 'light' ? 'white' : '#664d03',
    '&:hover': {
      bgcolor: mode === 'light' ? 'primary.dark' : '#ffe066',
      boxShadow: 2,
    },
    transition: 'background 0.2s',
  }}
>
  {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
</IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: '64px !important'
        }}>
          <Typography variant="h4" component="h1" color="#dc004e" sx={{ 
            fontWeight: 'bold',
            fontSize: '1.75rem'
          }}>
            Biller Tracker
          </Typography>
        </Toolbar>
        <Box sx={{ mt: 2 }}>
          <List>
            {navigationItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? 'white' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: 'background.default', border:'none' , boxShadow:'none' }}>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={
                  <Box sx={{ display: 'grid', gap: 4 }}>
                    <DashboardOverview />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                      <BillerStatusChart />
                      <Top50BillerChart />
                    </Box>
                  </Box>
                } />
                <Route path="/billers" element={<BillerList />} />
                <Route path="/unavailable-isp" element={<UnavailableISPList />} />
                <Route path="/unavailable-mfi" element={<UnavailableMFIList />} />
                <Route path="/top-50-billers" element={<Top50BillersList />} />
              </Routes>
            </Suspense>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
