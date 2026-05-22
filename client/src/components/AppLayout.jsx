import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';

import NavList from './NavList';

const DRAWER_WIDTH = 248;

function Brand() {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{
          width: 28, height: 28, borderRadius: 1.5,
          background: 'linear-gradient(135deg, #3B5BDB 0%, #5C7BFF 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em',
        }}
      >
        S
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>SubBase</Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.1 }}>
          PM Exercise
        </Typography>
      </Box>
    </Stack>
  );
}

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2 }}>
        <Brand />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <NavList onNavigate={() => setMobileOpen(false)} />
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth
          component="a"
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          startIcon={<ArticleIcon fontSize="small" />}
          endIcon={<LaunchIcon fontSize="small" />}
          variant="outlined"
          size="small"
        >
          API Docs
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top bar — only shown on mobile, used for menu toggle */}
      {!isDesktop && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ minHeight: 56 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              size="small"
              aria-label="Open menu"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Brand />
          </Toolbar>
        </AppBar>
      )}

      {/* Permanent sidebar on desktop, temporary drawer on mobile */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: 0 }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            PaperProps={{
              sx: { width: DRAWER_WIDTH, boxSizing: 'border-box', position: 'fixed' },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            PaperProps={{ sx: { width: DRAWER_WIDTH } }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 4 },
          pt: { xs: 9, md: 4 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
