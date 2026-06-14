import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import SignalIcon from '@mui/icons-material/SignalCellularAltOutlined';
import WifiIcon from '@mui/icons-material/WifiOutlined';
import WifiOffIcon from '@mui/icons-material/WifiOffOutlined';
import BatteryIcon from '@mui/icons-material/BatteryFull';

// Cosmetic iPhone shell for the field view on desktop, so a screen-share reads instantly as the
// superintendent's mobile app. Pure CSS chrome — bezel, Dynamic Island, status bar, home indicator —
// around a ~390px scrollable screen. The `online` flag flips the status-bar wifi glyph so the
// simulated-offline state is visible even in the device chrome.
//
// Props: online (bool), children (the screen content).
export default function PhoneFrame({ online = true, children }) {
  return (
    <Box
      sx={{
        width: 408,
        maxWidth: '100%',
        mx: 'auto',
        p: '12px',
        borderRadius: '54px',
        bgcolor: '#0B0B0F',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28), 0 2px 6px rgba(15,23,42,0.2)',
        position: 'relative',
      }}
    >
      {/* Screen */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: '42px',
          overflow: 'hidden',
          bgcolor: 'background.default',
          height: 760,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Status bar */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 3.5, pt: 1.75, pb: 0.5, flexShrink: 0, color: 'text.primary', zIndex: 2 }}
        >
          <Box sx={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>9:41</Box>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <SignalIcon sx={{ fontSize: 16 }} />
            {online ? (
              <WifiIcon sx={{ fontSize: 16 }} />
            ) : (
              <WifiOffIcon sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <BatteryIcon sx={{ fontSize: 20 }} />
          </Stack>
        </Stack>

        {/* Dynamic Island */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 116,
            height: 32,
            borderRadius: 16,
            bgcolor: '#0B0B0F',
            zIndex: 3,
          }}
        />

        {/* Scrollable app content */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, pt: 1.5, pb: 3 }}>{children}</Box>

        {/* Home indicator */}
        <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'center', pb: 1, pt: 0.5 }}>
          <Box
            sx={{ width: 134, height: 5, borderRadius: 3, bgcolor: 'text.primary', opacity: 0.85 }}
          />
        </Box>
      </Box>
    </Box>
  );
}
