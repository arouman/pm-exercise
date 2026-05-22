import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

// Generic table-row loading state.
export default function LoadingSkeleton({ rows = 6 }) {
  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 1 }} />
      ))}
    </Stack>
  );
}
