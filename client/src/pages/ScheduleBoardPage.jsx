import { useEffect, useMemo, useState } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';
import AddIcon from '@mui/icons-material/AddOutlined';
import WarningIcon from '@mui/icons-material/WarningAmberRounded';

import PageHeader from '../components/PageHeader';
import { useEntities } from '../hooks/useEntities';
import { useApiMutation } from '../hooks/useMutations';
import { api } from '../api/client';
import { fmtDate, titleCase } from '../rentals/format';

const DAY = 24 * 60 * 60 * 1000;
// Bars are tinted per project from this palette (index by project order).
const PROJECT_COLORS = ['#3B5BDB', '#0E9F6E', '#9333EA', '#E08600', '#0891B2', '#DB2777'];

const FLEET_MANAGER_ID = 'usr_fleet_1';

// When a bar visually occupies the row: returned -> actualEndDate, still-out ACTIVE -> open-ended
// (runs to "now"), otherwise the planned expectedEndDate. Mirrors the server's occupiedUntil.
function barEnd(a, windowEnd) {
  if (a.actualEndDate) return new Date(a.actualEndDate).getTime();
  if (a.status === 'ACTIVE') return windowEnd; // open-ended, drawn to the edge
  return new Date(a.expectedEndDate).getTime();
}

function rangesOverlap(aS, aE, bS, bE) {
  return aS <= bE && bS <= aE;
}

export default function ScheduleBoardPage() {
  const equipment = useEntities('/api/equipment');
  const assignments = useEntities('/api/equipment-assignments');
  const projects = useEntities('/api/projects');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [snack, setSnack] = useState(null);

  const projectColor = useMemo(() => {
    const map = {};
    (projects.data || []).forEach((p, i) => {
      map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length];
    });
    return map;
  }, [projects.data]);

  // Time window spanning every assignment, padded a week each side, with today inside it.
  const { windowStart, windowEnd, monthTicks, todayPct } = useMemo(() => {
    const today = Date.now();
    const dates = [today];
    for (const a of assignments.data || []) {
      dates.push(new Date(a.startDate).getTime());
      dates.push(new Date(a.actualEndDate || a.expectedEndDate).getTime());
    }
    const min = Math.min(...dates) - 7 * DAY;
    const max = Math.max(...dates) + 7 * DAY;
    const span = max - min || 1;
    // Month boundary ticks.
    const ticks = [];
    const d = new Date(min);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    while (d.getTime() < max) {
      ticks.push({
        pct: ((d.getTime() - min) / span) * 100,
        label: d.toLocaleDateString(undefined, { month: 'short' }),
      });
      d.setMonth(d.getMonth() + 1);
    }
    return {
      windowStart: min,
      windowEnd: max,
      monthTicks: ticks,
      todayPct: ((today - min) / span) * 100,
    };
  }, [assignments.data]);

  const span = windowEnd - windowStart || 1;
  const pct = (ms) => ((ms - windowStart) / span) * 100;

  // Group assignments by machine, and flag per-machine overlaps (the double-booking the board exists
  // to surface). Two non-returned assignments whose occupied windows overlap are a conflict.
  const rows = useMemo(() => {
    const byMachine = new Map();
    for (const a of assignments.data || []) {
      if (!byMachine.has(a.equipmentId)) byMachine.set(a.equipmentId, []);
      byMachine.get(a.equipmentId).push(a);
    }
    return (equipment.data || []).map((m) => {
      const items = (byMachine.get(m.id) || [])
        .slice()
        .sort((x, y) => new Date(x.startDate) - new Date(y.startDate));
      const conflictIds = new Set();
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          if (a.status === 'RETURNED' || b.status === 'RETURNED') continue;
          if (
            rangesOverlap(
              new Date(a.startDate).getTime(),
              barEnd(a, windowEnd),
              new Date(b.startDate).getTime(),
              barEnd(b, windowEnd),
            )
          ) {
            conflictIds.add(a.id);
            conflictIds.add(b.id);
          }
        }
      }
      return { machine: m, items, conflictIds };
    });
  }, [equipment.data, assignments.data, windowEnd]);

  const conflictCount = rows.reduce((n, r) => n + (r.conflictIds.size > 0 ? 1 : 0), 0);

  return (
    <>
      <PageHeader
        title="Schedule"
        info="Equipment assignments across projects over time. Each bar is a machine on a project; overlapping bars on one row are a double-booking. Use Assign to schedule a machine and check for conflicts before committing."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Assign equipment
          </Button>
        }
      />

      {conflictCount > 0 && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <AlertTitle>
            {conflictCount} machine{conflictCount === 1 ? '' : 's'} double-booked
          </AlertTitle>
          Outlined bars below overlap in time on the same machine. Resolve before the crews collide.
        </Alert>
      )}

      <Card sx={{ p: 0, overflow: 'hidden' }}>
        {/* Timeline header */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ width: 150, flexShrink: 0, px: 2, py: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'text.secondary',
              }}
            >
              Machine
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', flex: 1, height: 32 }}>
            {monthTicks.map((t, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  left: `${t.pct}%`,
                  top: 0,
                  bottom: 0,
                  borderLeft: '1px dashed',
                  borderColor: 'divider',
                  pl: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t.label}
                </Typography>
              </Box>
            ))}
            <TodayLine pct={todayPct} label />
          </Box>
        </Box>

        {/* Machine rows */}
        <Box sx={{ position: 'relative' }}>
          {rows.map(({ machine, items, conflictIds }) => (
            <Box
              key={machine.id}
              sx={{
                display: 'flex',
                alignItems: 'stretch',
                borderBottom: '1px solid',
                borderColor: 'divider',
                minHeight: 44,
              }}
            >
              <Box
                sx={{
                  width: 150,
                  flexShrink: 0,
                  px: 2,
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, lineHeight: 1.2 }}
                >
                  {machine.assetTag}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 130 }}>
                  {titleCase(machine.category)}
                </Typography>
              </Box>
              <Box sx={{ position: 'relative', flex: 1, my: 0.75, mr: 1 }}>
                {monthTicks.map((t, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: 'absolute',
                      left: `${t.pct}%`,
                      top: -6,
                      bottom: -6,
                      borderLeft: '1px dashed',
                      borderColor: 'divider',
                      opacity: 0.5,
                    }}
                  />
                ))}
                <TodayLine pct={todayPct} />
                {items.map((a) => {
                  const left = Math.max(0, pct(new Date(a.startDate).getTime()));
                  const right = Math.min(100, pct(barEnd(a, windowEnd)));
                  const width = Math.max(1.5, right - left);
                  const isConflict = conflictIds.has(a.id);
                  const color = projectColor[a.projectId] || '#64748B';
                  return (
                    <Tooltip
                      key={a.id}
                      arrow
                      title={`${a.project?.name || 'Project'} · ${fmtDate(a.startDate)} → ${fmtDate(a.actualEndDate || a.expectedEndDate)}${a.actualEndDate ? '' : ' (exp.)'} · ${a.status}`}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 22,
                          borderRadius: 1,
                          bgcolor: a.status === 'RETURNED' ? 'transparent' : color,
                          border: isConflict ? '2px solid' : '1px solid',
                          borderColor: isConflict
                            ? 'error.main'
                            : a.status === 'RETURNED'
                              ? color
                              : 'transparent',
                          opacity: a.status === 'SCHEDULED' ? 0.55 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          px: 0.75,
                          overflow: 'hidden',
                          cursor: 'default',
                          boxShadow: isConflict ? '0 0 0 2px rgba(239,68,68,0.18)' : 'none',
                        }}
                      >
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: a.status === 'RETURNED' ? 'text.secondary' : '#fff',
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        >
                          {a.project?.name}
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </Card>

      {/* Legend */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1.5, px: 0.5 }}>
        {(projects.data || []).map((p) => (
          <Stack key={p.id} direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: projectColor[p.id] }} />
            <Typography variant="caption" color="text.secondary">
              {p.name}
            </Typography>
          </Stack>
        ))}
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: 0.5,
              border: '2px solid',
              borderColor: 'error.main',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Double-booked
          </Typography>
        </Stack>
      </Stack>

      <AssignDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        equipment={equipment.data || []}
        projects={projects.data || []}
        onCreated={(conflicts) =>
          setSnack(
            conflicts.length
              ? {
                  severity: 'warning',
                  msg: `Assignment saved with ${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'}.`,
                }
              : { severity: 'success', msg: 'Assignment scheduled.' },
          )
        }
      />

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}

function TodayLine({ pct, label }) {
  if (pct < 0 || pct > 100) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${pct}%`,
        top: 0,
        bottom: 0,
        borderLeft: '2px solid',
        borderColor: 'secondary.main',
        zIndex: 1,
      }}
    >
      {label && (
        <Typography
          variant="caption"
          sx={{ position: 'absolute', top: 2, left: 4, color: 'secondary.dark', fontWeight: 700 }}
        >
          Today
        </Typography>
      )}
    </Box>
  );
}

function AssignDialog({ open, onClose, equipment, projects, onCreated }) {
  const [equipmentId, setEquipmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [checking, setChecking] = useState(false);

  const create = useApiMutation('post', '/api/equipment-assignments');

  // Reset when reopened.
  useEffect(() => {
    if (open) {
      setEquipmentId('');
      setProjectId('');
      setStartDate('');
      setEndDate('');
      setNotes('');
      setConflicts([]);
    }
  }, [open]);

  // Live conflict check whenever machine + both dates are set (the pre-submit warning).
  useEffect(() => {
    if (!equipmentId || !startDate || !endDate) {
      setConflicts([]);
      return;
    }
    let cancelled = false;
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ equipmentId, startDate, endDate });
        const res = await api.get(`/api/equipment-assignments/conflicts?${params}`);
        if (!cancelled) setConflicts(res);
      } catch {
        if (!cancelled) setConflicts([]);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [equipmentId, startDate, endDate]);

  const valid =
    equipmentId && projectId && startDate && endDate && new Date(endDate) >= new Date(startDate);

  function submit() {
    create.mutate(
      {
        equipmentId,
        projectId,
        startDate,
        expectedEndDate: endDate,
        status: 'SCHEDULED',
        notes: notes || null,
        createdById: FLEET_MANAGER_ID,
      },
      {
        onSuccess: (res) => {
          onCreated(res?.conflicts || []);
          onClose();
        },
      },
    );
  }

  const machine = equipment.find((m) => m.id === equipmentId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign equipment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            select
            label="Machine"
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            fullWidth
          >
            {equipment.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.assetTag} — {m.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            fullWidth
          >
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Expected end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={1}
          />

          {/* Conflict warning — non-blocking, the fleet manager decides */}
          {conflicts.length > 0 && (
            <Alert severity="warning" icon={<WarningIcon />}>
              <AlertTitle>{machine?.assetTag} is already booked in this window</AlertTitle>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {conflicts.map((c) => (
                  <Typography key={c.id} variant="body2">
                    {c.project?.name || 'Project'}: {fmtDate(c.startDate)} →{' '}
                    {fmtDate(c.actualEndDate || c.expectedEndDate)}
                    {c.actualEndDate ? '' : ' (exp.)'} · {c.status}
                  </Typography>
                ))}
              </Stack>
              You can still schedule it — conflicts are a warning, not a block.
            </Alert>
          )}
          {checking && (
            <Typography variant="caption" color="text.secondary">
              Checking availability…
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={!valid || create.isPending}
          color={conflicts.length > 0 ? 'warning' : 'primary'}
        >
          {create.isPending ? 'Saving…' : conflicts.length > 0 ? 'Schedule anyway' : 'Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
