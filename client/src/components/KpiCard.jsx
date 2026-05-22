import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

// Dashboard metric card. Big number, small label, optional delta/sub-text below.
//
// Props:
//   label  — uppercase label, e.g. "Active Projects"
//   value  — the metric (string or number)
//   sub    — optional sub-line below the value, e.g. "+2 this week" or "across 4 sites"
//   icon   — optional icon node shown on the right
export default function KpiCard({ label, value, sub, icon, tone = 'neutral' }) {
  const tones = {
    neutral: { color: 'primary.main', bg: 'rgba(59, 91, 219, 0.08)' },
    success: { color: 'success.main', bg: 'rgba(16, 185, 129, 0.08)' },
    warning: { color: 'warning.main', bg: 'rgba(245, 159, 0, 0.10)' },
    danger:  { color: 'error.main',   bg: 'rgba(239, 68, 68, 0.08)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="text.secondary">{label}</Typography>
            <Typography variant="h1" sx={{ mt: 0.5, lineHeight: 1.1 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {sub}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: t.bg, color: t.color, borderRadius: 2,
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
