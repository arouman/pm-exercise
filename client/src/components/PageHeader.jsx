import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// Consistent top-of-page header. Always use this for new pages so spacing stays uniform.
//
// Props:
//   title       (required) — main page title
//   subtitle    (optional) — short context line under the title
//   action      (optional) — a single React node (typically a Button) shown right-aligned
export default function PageHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h1" component="h1">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Stack>
    </Box>
  );
}
