import { useState } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import LocationOnIcon from '@mui/icons-material/LocationOnOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import POIcon from '@mui/icons-material/ReceiptLongOutlined';

import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import DetailDrawer from '../components/DetailDrawer';
import EmptyState from '../components/EmptyState';
import { useEntities, useEntity } from '../hooks/useEntities';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const ROLE_LABEL = {
  PROCUREMENT: 'Procurement',
  SUPERINTENDENT: 'Superintendent',
  FLEET_MANAGER: 'Fleet Manager',
};

export default function ProjectsPage() {
  const { data = [], isLoading } = useEntities('/api/projects');
  const [selectedId, setSelectedId] = useState(null);
  const { data: detail } = useEntity(selectedId ? `/api/projects/${selectedId}` : null);

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Each job site SubBase customers are running. Click a card for assignments and totals."
      />
      {!isLoading && data.length === 0 ? (
        <EmptyState title="No projects yet" />
      ) : (
        <Grid container spacing={3}>
          {(isLoading ? Array.from({ length: 4 }) : data).map((p, i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={p?.id || i}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea
                  onClick={() => p && setSelectedId(p.id)}
                  disabled={!p}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {p?.customer || '—'}
                      </Typography>
                      {p && <StatusChip value={p.status} />}
                    </Stack>
                    <Typography variant="h4" component="h2" sx={{ mb: 1.5 }}>
                      {p?.name || '—'}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.75} color="text.secondary" sx={{ mb: 2 }}>
                      <LocationOnIcon fontSize="small" sx={{ fontSize: 16 }} />
                      <Typography variant="body2" noWrap>
                        {p?.address || '—'}
                      </Typography>
                    </Stack>
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack direction="row" spacing={3}>
                      <Stat label="POs" value={p?._count?.purchaseOrders ?? '—'} icon={<POIcon fontSize="small" />} />
                      <Stat label="Team" value={p?._count?.users ?? '—'} icon={<GroupIcon fontSize="small" />} />
                      <Stat label="Started" value={p ? fmtDate(p.startDate) : '—'} />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <DetailDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detail?.name || 'Project'}
        subtitle={detail?.customer}
      >
        {detail && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5}>
              <StatusChip value={detail.status} />
              <Typography variant="body2" color="text.secondary">
                {fmtDate(detail.startDate)} → {fmtDate(detail.projectedEndDate)}
              </Typography>
            </Stack>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Site address
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>{detail.address}</Typography>
            </Box>
            <Divider />
            <Stack direction="row" spacing={4}>
              <Stat label="Purchase orders" value={detail._count?.purchaseOrders ?? 0} large />
              <Stat label="Inventory items" value={detail._count?.inventoryItems ?? 0} large />
              <Stat label="Transactions" value={detail._count?.inventoryTransactions ?? 0} large />
            </Stack>
            <Divider />
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>Team ({detail.users?.length || 0})</Typography>
              <Stack divider={<Divider flexItem />} spacing={0}>
                {detail.users?.map(({ user }) => (
                  <Stack key={user.id} direction="row" justifyContent="space-between" sx={{ py: 1 }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                      {ROLE_LABEL[user.role] || user.role}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </DetailDrawer>
    </>
  );
}

function Stat({ label, value, icon, large }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {icon && <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>}
        <Typography variant={large ? 'h2' : 'body1'} sx={{ fontWeight: 600 }}>{value}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}
