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
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'block',
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: 'text.primary',
              }}
            >
              {value}
            </Typography>
            {sub && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                {sub}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: t.bg, color: t.color, borderRadius: 2,
                flexShrink: 0,
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
