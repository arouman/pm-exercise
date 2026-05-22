import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';

// Right-side slide-in detail panel. The standard pattern across the app for
// "click a row, see more info." Avoid making separate detail pages for sub-entities
// (line items, etc.) — just open them in here.
//
// Props:
//   open       (required)
//   onClose    (required)
//   title      (required) — drawer heading
//   subtitle   optional caption under title
//   width      defaults to 480
//   children   the body content
export default function DetailDrawer({ open, onClose, title, subtitle, width = 480, children }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: width } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h2" component="h2">{title}</Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            <IconButton onClick={onClose} size="small" aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>{children}</Box>
      </Box>
    </Drawer>
  );
}
