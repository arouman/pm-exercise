import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Shown when a list/grid resolves to zero rows. Illustration-free on purpose —
// the candidate can add their own if they want.
export default function EmptyState({ title = 'Nothing here yet', subtitle, action }) {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography variant="h4" color="text.primary">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {subtitle}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
