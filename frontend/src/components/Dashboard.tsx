import React from 'react';
import { Container, Typography, Box, Paper, AppBar, Toolbar, Button, CircularProgress, Drawer, List, ListItem, ListItemText, ListItemButton, ListItemIcon, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
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
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const isSmallScreen = useMediaQuery('(max-width:900px)');
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
        width: '100%',
        ml: 0,
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', alignItems: 'center', minHeight: '64px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" color="#dc004e" sx={{ fontWeight: 'bold', fontSize: '1.75rem', mr: 1 }}>
              Biller Tracker
            </Typography>
            <IconButton
  aria-label="open sidebar"
  edge="end"
  onClick={() => setDrawerOpen((open) => !open)}
  disableRipple
  disableFocusRipple
  disableTouchRipple
  tabIndex={0}
  sx={{
    color: mode === 'light' ? '#212121' : '#fff',
    background: 'none !important',
    boxShadow: 'none !important',
    outline: 'none !important',
    ml: 0.5,
    '&:hover': {
      background: 'none !important',
      boxShadow: 'none !important',
      outline: 'none !important',
    },
    '&:active': {
      background: 'none !important',
      boxShadow: 'none !important',
      outline: 'none !important',
    },
    '&:focus': {
      background: 'none !important',
      boxShadow: 'none !important',
      outline: 'none !important',
    },
    '&.Mui-focusVisible': {
      background: 'none !important',
      boxShadow: 'none !important',
      outline: 'none !important',
    },
    '& .MuiTouchRipple-root': {
      display: 'none !important',
    }
  }}
>
  <MenuIcon sx={{ fontSize: 28, color: mode === 'light' ? '#212121' : '#fff' }} />
</IconButton>
          </Box>
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
        anchor="left"
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            height: '100%',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      >
         <Toolbar /> {/* <-- Add this line */}
  <Box>
    <List>
      {/* ...navigationItems.map... */}
    </List>
  </Box>
        <Box>
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

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
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
