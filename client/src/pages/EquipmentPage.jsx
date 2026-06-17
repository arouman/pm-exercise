import { useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import PhotoIcon from '@mui/icons-material/PhotoCameraOutlined';

import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import DetailDrawer from '../components/DetailDrawer';
import { useEntities, useEntity } from '../hooks/useEntities';
import { fmtUSD, fmtDate, fmtDateTime, titleCase, daysBetween } from '../rentals/format';

const OWNERSHIP_OPTS = ['ALL', 'OWNED', 'RENTED'];
const STATUS_OPTS = ['ALL', 'AVAILABLE', 'IN_USE', 'IDLE', 'DOWN', 'RETURNED'];

const mono = { fontFamily: 'ui-monospace, monospace' };

// Small inline progress bar reused in the grid + drawer. `invert` flips the color ramp for metrics
// where HIGH is bad (depreciation / life consumed) vs. utilization where high is good.
function UtilBar({ pct, invert = false }) {
  const high = invert ? 'error' : 'success';
  const low = invert ? 'success' : 'error';
  const color = pct >= 60 ? high : pct >= 30 ? 'warning' : low;
  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {pct}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ height: 6, borderRadius: 1, backgroundColor: 'rgba(15,23,42,0.05)' }}
      />
    </Box>
  );
}

export default function EquipmentPage() {
  const [ownership, setOwnership] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const qs = new URLSearchParams();
  if (ownership !== 'ALL') qs.set('ownership', ownership);
  if (status !== 'ALL') qs.set('status', status);
  const listPath = `/api/equipment${qs.toString() ? `?${qs}` : ''}`;
  const { data = [], isLoading } = useEntities(listPath);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (m) =>
        m.assetTag.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.make || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const [selectedId, setSelectedId] = useState(null);
  const { data: detail } = useEntity(selectedId ? `/api/equipment/${selectedId}` : null);

  const columns = [
    {
      field: 'assetTag',
      headerName: 'Asset',
      flex: 1.4,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            lineHeight: 1.3,
          }}
        >
          <Typography variant="body2" sx={{ ...mono, fontWeight: 600, lineHeight: 1.3 }}>
            {row.assetTag}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            {row.name} · {titleCase(row.category)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'ownership',
      headerName: 'Ownership',
      flex: 0.7,
      minWidth: 120,
      renderCell: ({ row }) => <StatusChip value={row.ownership} />,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 120,
      renderCell: ({ row }) => <StatusChip value={row.isOverdue ? 'OVERDUE' : row.status} />,
    },
    {
      field: 'currentProject',
      headerName: 'On site',
      flex: 1.3,
      minWidth: 180,
      valueGetter: (v, row) => row.currentProject?.name || '',
      renderCell: ({ row }) =>
        row.currentProject ? (
          <Typography variant="body2">{row.currentProject.name}</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            In yard
          </Typography>
        ),
    },
    {
      field: 'utilizationPct',
      headerName: 'Utilization',
      flex: 1,
      minWidth: 130,
      renderCell: ({ row }) => <UtilBar pct={row.utilizationPct} />,
    },
    {
      field: 'wasteToDate',
      headerName: 'Off-rent waste',
      flex: 0.9,
      minWidth: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) =>
        row.isOverdue ? (
          <Stack alignItems="flex-end" sx={{ width: '100%' }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: 'error.main', fontVariantNumeric: 'tabular-nums' }}
            >
              {fmtUSD(row.wasteToDate)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.daysOverdue}d over
            </Typography>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ width: '100%', textAlign: 'right' }}
          >
            —
          </Typography>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Equipment"
        info="Combined view of owned and rented-in equipment. Select a machine to view its specifications, assignment history, and field event timeline."
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Ownership"
          value={ownership}
          onChange={(e) => setOwnership(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {OWNERSHIP_OPTS.map((o) => (
            <MenuItem key={o} value={o}>
              {o === 'ALL' ? 'All' : titleCase(o)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {STATUS_OPTS.map((s) => (
            <MenuItem key={s} value={s}>
              {s === 'ALL' ? 'All' : titleCase(s)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search"
          placeholder="Tag, name, or make…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
        />
      </Stack>

      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          autoHeight
          rowHeight={64}
          disableRowSelectionOnClick
          onRowClick={(p) => setSelectedId(p.row.id)}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          getRowId={(r) => r.id}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
        />
      </Card>

      <DetailDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detail?.assetTag || 'Equipment'}
        subtitle={detail ? `${detail.name} · ${titleCase(detail.category)}` : null}
        width={620}
      >
        {detail && <EquipmentDetail machine={detail} />}
      </DetailDrawer>
    </>
  );
}

function EquipmentDetail({ machine }) {
  const active = machine.assignments?.find((a) => a.status === 'ACTIVE');
  const history = machine.assignments || [];
  const events = machine.events || [];

  return (
    <Stack spacing={3}>
      {/* Header chips + key specs */}
      <Stack direction="row" spacing={1}>
        <StatusChip value={machine.ownership} />
        <StatusChip value={machine.isOverdue ? 'OVERDUE' : machine.status} />
      </Stack>

      {machine.isOverdue && (
        <Card
          variant="outlined"
          sx={{ borderColor: 'error.light', bgcolor: 'rgba(239,68,68,0.05)', p: 2 }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'error.main',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Off-rent waste
          </Typography>
          <Typography variant="h3" sx={{ color: 'error.main', mt: 0.5 }}>
            {fmtUSD(machine.wasteToDate)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {machine.daysOverdue} days past expected off-rent at {fmtUSD(machine.dailyRate)}/day.
          </Typography>
        </Card>
      )}

      <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
        <Spec label="Daily rate" value={fmtUSD(machine.dailyRate)} />
        <Spec
          label="Make / model"
          value={[machine.make, machine.model].filter(Boolean).join(' ') || '—'}
        />
        <Spec label="Year" value={machine.year || '—'} />
        <Spec
          label="Hours"
          value={machine.hoursUsed != null ? `${machine.hoursUsed.toLocaleString()} h` : '—'}
        />
        <Spec
          label="Condition"
          value={machine.acquisitionCondition ? titleCase(machine.acquisitionCondition) : '—'}
        />
        {machine.vendor && <Spec label="Vendor" value={machine.vendor.name} />}
        {machine.purchaseOrder && (
          <Spec label="Rental PO" value={machine.purchaseOrder.poNumber} mono />
        )}
      </Stack>

      <Box>
        <Typography variant="caption" color="text.secondary">
          Utilization (days deployed ÷ days available)
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <UtilBar pct={machine.utilizationPct} />
        </Box>
      </Box>

      {machine.bookValue != null && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography variant="caption" color="text.secondary">
              Depreciation (life consumed by hours)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Book value{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {fmtUSD(machine.bookValue)}
              </Box>{' '}
              of {fmtUSD(machine.acquisitionCost)}
            </Typography>
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            <UtilBar pct={machine.depreciationPct} invert />
          </Box>
        </Box>
      )}

      <Divider />

      {/* Current assignment */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Current assignment
        </Typography>
        {active ? (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {active.project?.name || 'Unknown project'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fmtDate(active.startDate)} → {fmtDate(active.expectedEndDate)} (expected) ·{' '}
              {daysBetween(active.startDate)} days on site · {fmtUSD(active.dailyRate)}/day
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not assigned — currently in the yard.
          </Typography>
        )}
      </Box>

      {/* Assignment history */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Assignment history ({history.length})
        </Typography>
        {history.length ? (
          <Stack divider={<Divider flexItem />} spacing={0}>
            {history.map((a) => {
              const end = a.actualEndDate || a.expectedEndDate;
              const days = daysBetween(a.startDate, a.actualEndDate || new Date());
              return (
                <Stack key={a.id} direction="row" alignItems="center" spacing={2} sx={{ py: 1.25 }}>
                  <StatusChip value={a.status} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {a.project?.name || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fmtDate(a.startDate)} → {fmtDate(end)}
                      {a.actualEndDate ? '' : ' (expected)'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {fmtUSD(days * a.dailyRate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {days}d
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No assignments yet.
          </Typography>
        )}
      </Box>

      {/* Event timeline */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Field timeline ({events.length})
        </Typography>
        {events.length ? (
          <Stack divider={<Divider flexItem />} spacing={0}>
            {events.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No field events recorded.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function EventRow({ event }) {
  // The offline story: an event captured in the field (occurredAt) but only reaching the server
  // later (syncedAt) shows the lag, proving the queue replayed the original field time.
  const lagHrs = event.syncedAt
    ? Math.round((new Date(event.syncedAt) - new Date(event.occurredAt)) / (60 * 60 * 1000))
    : 0;
  return (
    <Stack direction="row" spacing={2} sx={{ py: 1.5 }} alignItems="flex-start">
      {event.photoUrl && (
        // Photos are mocked filenames in the prototype (no real upload/storage), so render an
        // explicit "photo attached" tile rather than a broken <img>. The filename is the evidence.
        <Tooltip title={event.photoUrl}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 1.5,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(15,23,42,0.05)',
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <PhotoIcon fontSize="small" />
          </Box>
        </Tooltip>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 0.25 }}
          flexWrap="wrap"
          useFlexGap
        >
          <StatusChip value={event.type} />
          {event.condition && <StatusChip value={event.condition} />}
        </Stack>
        {event.notes && (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {event.notes}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {event.user?.name || 'Field user'}
          {event.project ? ` · ${event.project.name}` : ''} · {fmtDateTime(event.occurredAt)}
          {lagHrs >= 1 && ` · synced ${lagHrs}h later (offline)`}
        </Typography>
      </Box>
    </Stack>
  );
}

function Spec({ label, value, mono: isMono }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ mt: 0.25, fontWeight: 600, ...(isMono ? mono : {}) }}>
        {value}
      </Typography>
    </Box>
  );
}
