import { createTheme } from '@mui/material/styles';

// SubBase design system. Light-mode only. Edit here and the entire app updates.
//
// Color philosophy:
//   - Primary (indigo blue): the brand voice. Used for nav active states, primary actions, links.
//   - Secondary (warm amber): a strong accent reserved for high-attention moments — primary CTAs.
//   - Status colors are semantic, not decorative — green=settled, amber=in-flight, red=stuck.
//
// Typography: Inter throughout. Slightly tighter line-heights than MUI defaults for a denser
// "real product" feel without losing readability.

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3B5BDB', dark: '#2C46B5', light: '#5C7BFF', contrastText: '#FFFFFF' },
    secondary: { main: '#F59F00', dark: '#E08600', light: '#FFB733', contrastText: '#1A1A1A' },
    success: { main: '#10B981', light: '#D1FAE5', dark: '#059669' },
    warning: { main: '#F59F00', light: '#FEF3C7', dark: '#B45309' },
    info: { main: '#3B82F6', light: '#DBEAFE', dark: '#1D4ED8' },
    error: { main: '#EF4444', light: '#FEE2E2', dark: '#B91C1C' },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#CBD5E1',
    },
    divider: '#E2E8F0',
  },

  shape: {
    borderRadius: 8,
  },

  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.015em' },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '0.05em' },
    body1: { fontSize: '0.875rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4, color: '#64748B' },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 16, paddingBlock: 8 },
        sizeLarge: { paddingInline: 22, paddingBlock: 10, fontSize: '0.9375rem' },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 1px 2px rgba(59, 91, 219, 0.18)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
    MuiAppBar: {
      defaultProps: { color: 'inherit', elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          color: '#0F172A',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #E2E8F0', padding: '12px 16px' },
        head: {
          fontWeight: 600,
          color: '#64748B',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          backgroundColor: '#F8FAFC',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem', letterSpacing: 0 },
        sizeSmall: { height: 22 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0F172A',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 10px',
          borderRadius: 6,
        },
        arrow: { color: '#0F172A' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginInline: 8,
          marginBlock: 2,
          '&.Mui-selected': {
            backgroundColor: 'rgba(59, 91, 219, 0.08)',
            color: '#3B5BDB',
            '& .MuiListItemIcon-root': { color: '#3B5BDB' },
            '&:hover': { backgroundColor: 'rgba(59, 91, 219, 0.12)' },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { minWidth: 36, color: '#64748B' } },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          fontSize: '0.875rem',
          '--DataGrid-rowBorderColor': '#E2E8F0',
        },
        columnHeaders: {
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        },
        columnHeader: { fontWeight: 600, color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
        cell: { borderBottom: '1px solid #E2E8F0' },
        row: { '&:hover': { backgroundColor: '#F8FAFC', cursor: 'pointer' } },
        footerContainer: { borderTop: '1px solid #E2E8F0' },
      },
    },
  },
});
