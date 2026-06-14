import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';

import OnRentIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import WasteIcon from '@mui/icons-material/WarningAmberOutlined';
import UtilizationIcon from '@mui/icons-material/SpeedOutlined';
import SpendIcon from '@mui/icons-material/PaymentsOutlined';

import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import StatusChip from '../components/StatusChip';
import { useEntities } from '../hooks/useEntities';
import { fmtUSD, daysBetween } from '../rentals/format';

export default function RentalsDashboardPage() {
  const navigate = useNavigate();
  const offRent = useEntities('/api/equipment/off-rent');
  const util = useEntities('/api/equipment/utilization');
  const assignments = useEntities('/api/equipment-assignments');

  const loading = offRent.isLoading || util.isLoading || assignments.isLoading;

  // Total $ currently being burned holding machines past their expected off-rent date — the wedge's
  // headline number. SubBase already holds the rental POs, so it can quantify this cold.
  const totalWaste = useMemo(
    () => (offRent.data || []).reduce((sum, m) => sum + (m.wasteToDate || 0), 0),
    [offRent.data],
  );

  // Cost-to-job: rental $ allocated per project = Σ dailyRate × days on site, RENTED machines only.
  // Days run from the assignment start to its actual end (or today if still out).
  const costToJob = useMemo(() => {
    const rows = (assignments.data || []).filter((a) => a.equipment?.ownership === 'RENTED');
    const byProject = new Map();
    for (const a of rows) {
      const days = daysBetween(a.startDate, a.actualEndDate || new Date());
      const cost = days * a.dailyRate;
      const key = a.project?.name || 'Unassigned';
      byProject.set(key, (byProject.get(key) || 0) + cost);
    }
    const list = [...byProject.entries()]
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost);
    const total = list.reduce((s, r) => s + r.cost, 0);
    return { list, total };
  }, [assignments.data]);

  const fleet = util.data?.fleet;
  const machines = useMemo(
    () => [...(util.data?.machines || [])].sort((a, b) => b.utilizationPct - a.utilizationPct),
    [util.data],
  );

  return (
    <>
      <PageHeader
        title="Rentals"
        subtitle="The rent-in wedge: what's on rent, what's bleeding money past its off-rent date, and how hard the fleet is working."
      />

      {/* KPI row — off-rent waste is the money shot */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            label="On Rent"
            value={loading ? <Skeleton width={48} /> : (fleet?.onRentCount ?? 0)}
            sub={fleet ? `${fleet.machineCount} machines tracked` : null}
            tone="neutral"
            icon={<OnRentIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            label="Off-Rent Waste"
            value={loading ? <Skeleton width={80} /> : fmtUSD(totalWaste)}
            sub={loading ? null : `${offRent.data?.length ?? 0} machines past off-rent date`}
            tone="danger"
            icon={<WasteIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            label="Fleet Utilization"
            value={loading ? <Skeleton width={48} /> : `${fleet?.avgUtilizationPct ?? 0}%`}
            sub="Avg days deployed ÷ available"
            tone="warning"
            icon={<UtilizationIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            label="Rental Spend to Date"
            value={loading ? <Skeleton width={80} /> : fmtUSD(costToJob.total)}
            sub="Across all rented assignments"
            tone="neutral"
            icon={<SpendIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} alignItems="stretch">
        {/* Off-rent alerts — the actionable list */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                sx={{ mb: 0.5 }}
              >
                <Typography variant="h3">Off-Rent Alerts</Typography>
                {!loading && offRent.data?.length > 0 && (
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {fmtUSD(totalWaste)} and counting
                  </Typography>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Rented machines sitting idle or unused past their expected off-rent date. Every day
                costs the daily rate.
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {loading ? (
                <Stack spacing={1}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height={56} />
                  ))}
                </Stack>
              ) : offRent.data?.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 4, textAlign: 'center' }}
                >
                  No machines are overdue. Nothing bleeding right now.
                </Typography>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {offRent.data.map((m) => (
                    <Stack
                      key={m.id}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ py: 1.5 }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}
                          >
                            {m.assetTag}
                          </Typography>
                          <StatusChip value="OVERDUE" />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {m.name} · {m.currentProject?.name || 'In yard'} ·{' '}
                          {m.vendor?.name || 'rental'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            color: 'error.main',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {fmtUSD(m.wasteToDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.daysOverdue}d × {fmtUSD(m.dailyRate)}/day
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
            <Box sx={{ px: 3, pb: 2 }}>
              <Button size="small" onClick={() => navigate('/equipment')}>
                View all equipment →
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Right rail: utilization + cost-to-job */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ mb: 0.5 }}>
                  Utilization by Machine
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Idle iron is the cheapest to give back. {fleet?.downCount ?? 0} down for service.
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {loading ? (
                  <Stack spacing={2}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} height={36} />
                    ))}
                  </Stack>
                ) : (
                  <Stack spacing={1.75}>
                    {machines.map((m) => (
                      <Box key={m.id}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}
                          >
                            {m.assetTag}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                          >
                            {m.utilizationPct}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={m.utilizationPct}
                          color={
                            m.utilizationPct >= 60
                              ? 'success'
                              : m.utilizationPct >= 30
                                ? 'warning'
                                : 'error'
                          }
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            backgroundColor: 'rgba(15,23,42,0.05)',
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ mb: 0.5 }}>
                  Rental Cost to Job
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Rental $ allocated per project (daily rate × days on site) — clean billing data
                  for the ERP.
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {loading ? (
                  <Stack spacing={2}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} height={42} />
                    ))}
                  </Stack>
                ) : costToJob.list.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No rental assignments yet.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {costToJob.list.map(({ name, cost }) => {
                      const pct = costToJob.total ? Math.round((cost / costToJob.total) * 100) : 0;
                      return (
                        <Box key={name}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 0.5 }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '60%',
                              }}
                            >
                              {name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                            >
                              {fmtUSD(cost)}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 6,
                              borderRadius: 1,
                              backgroundColor: 'rgba(15,23,42,0.05)',
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
