import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';

import ProjectsIcon from '@mui/icons-material/ConstructionOutlined';
import POIcon from '@mui/icons-material/ReceiptLongOutlined';
import DeliveryIcon from '@mui/icons-material/LocalShippingOutlined';
import InventoryIcon from '@mui/icons-material/InventoryOutlined';

import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import StatusChip from '../components/StatusChip';
import { useEntities } from '../hooks/useEntities';

function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const projects = useEntities('/api/projects');
  const pos = useEntities('/api/purchase-orders');
  const deliveries = useEntities('/api/deliveries');
  const inventory = useEntities('/api/inventory?lowStock=true');
  const recentTxns = useEntities('/api/inventory/transactions?limit=8');

  const loading =
    projects.isLoading || pos.isLoading || deliveries.isLoading || inventory.isLoading;

  // ----- KPI calculations
  const kpis = useMemo(() => {
    const activeProjects = projects.data?.filter((p) => p.status === 'ACTIVE').length ?? 0;
    const openPOs = pos.data?.filter((p) => ['SUBMITTED', 'PARTIALLY_RECEIVED', 'DRAFT'].includes(p.status)).length ?? 0;
    const pendingDeliveries = deliveries.data?.filter((d) => d.status === 'PENDING' || d.status === 'PARTIAL').length ?? 0;
    const lowStock = inventory.data?.length ?? 0;
    return { activeProjects, openPOs, pendingDeliveries, lowStock };
  }, [projects.data, pos.data, deliveries.data, inventory.data]);

  // ----- PO status breakdown
  const poBreakdown = useMemo(() => {
    if (!pos.data) return [];
    const counts = pos.data.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    const order = ['DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'];
    const total = pos.data.length || 1;
    return order
      .filter((k) => counts[k])
      .map((k) => ({ status: k, count: counts[k], pct: Math.round((counts[k] / total) * 100) }));
  }, [pos.data]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A snapshot of procurement, fulfillment, and on-site inventory across all projects."
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="Active Projects"
            value={loading ? <Skeleton width={48} /> : kpis.activeProjects}
            sub={projects.data ? `${projects.data.length} total` : null}
            tone="neutral"
            icon={<ProjectsIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="Open Purchase Orders"
            value={loading ? <Skeleton width={48} /> : kpis.openPOs}
            sub="Draft, Submitted, or Partial"
            tone="warning"
            icon={<POIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="Pending Deliveries"
            value={loading ? <Skeleton width={48} /> : kpis.pendingDeliveries}
            sub="Awaiting full receipt"
            tone="warning"
            icon={<DeliveryIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            label="Low-Stock Items"
            value={loading ? <Skeleton width={48} /> : kpis.lowStock}
            sub="< 100 units on hand"
            tone="danger"
            icon={<InventoryIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 0.5 }}>Recent Inventory Activity</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The last 8 stock movements across all projects.
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              {recentTxns.isLoading ? (
                <Stack spacing={1}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height={40} />
                  ))}
                </Stack>
              ) : recentTxns.data?.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No recent activity.
                </Typography>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {recentTxns.data?.map((t) => (
                    <Stack
                      key={t.id}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ py: 1.25 }}
                    >
                      <StatusChip value={t.type} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {t.material.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.project.name}
                          {t.fromProject ? ` ← ${t.fromProject.name}` : ''}
                          {' · '}
                          {t.reference || 'No note'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {t.quantity.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDateTime(t.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 0.5 }}>POs by Status</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Breakdown of every purchase order in the system.
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {pos.isLoading ? (
                <Stack spacing={2}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height={42} />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={2.5}>
                  {poBreakdown.map(({ status, count, pct }) => (
                    <Box key={status}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                        <StatusChip value={status} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {count} · {pct}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 6, borderRadius: 1,
                          backgroundColor: 'rgba(15,23,42,0.05)',
                          '& .MuiLinearProgress-bar': { borderRadius: 1 },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
