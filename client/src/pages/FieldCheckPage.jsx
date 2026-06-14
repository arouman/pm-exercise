import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';

import LoginIcon from '@mui/icons-material/LoginOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import DownIcon from '@mui/icons-material/BuildCircleOutlined';
import PhotoIcon from '@mui/icons-material/PhotoCameraOutlined';
import CheckIcon from '@mui/icons-material/CheckCircle';
import CloudOffIcon from '@mui/icons-material/CloudOffOutlined';
import CloudSyncIcon from '@mui/icons-material/CloudSyncOutlined';
import CloudDoneIcon from '@mui/icons-material/CloudDoneOutlined';

import PhoneFrame from '../field/PhoneFrame';
import { api } from '../api/client';
import { useEntities } from '../hooks/useEntities';
import { enqueue, flushQueue, queueCount, onQueueChange } from '../field/offlineQueue';
import { titleCase } from '../rentals/format';

// The three field actions the superintendent actually performs. Each maps to an EquipmentEvent type;
// the server advances Equipment.status and (for CHECK_IN) closes the active assignment.
const ACTIONS = [
  { type: 'CHECK_OUT', label: 'Check Out', Icon: LoginIcon, blurb: 'Take a machine to a job.' },
  { type: 'CHECK_IN', label: 'Check In', Icon: LogoutIcon, blurb: 'Return a machine from a job.' },
  {
    type: 'DOWN',
    label: 'Report Down',
    Icon: DownIcon,
    blurb: 'Flag a breakdown / needs service.',
  },
];

const CONDITIONS = ['GOOD', 'DAMAGED', 'NEEDS_SERVICE'];

export default function FieldCheckPage() {
  const queryClient = useQueryClient();
  const users = useEntities('/api/users');
  const equipment = useEntities('/api/equipment');

  const supers = useMemo(
    () => (users.data || []).filter((u) => u.role === 'SUPERINTENDENT'),
    [users.data],
  );

  const [userId, setUserId] = useState('');
  useEffect(() => {
    if (!userId && supers.length) setUserId(supers[0].id);
  }, [supers, userId]);
  const user = supers.find((u) => u.id === userId);

  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(queueCount());
  useEffect(() => onQueueChange((items) => setQueued(items.length)), []);

  // Capture form state
  const [action, setAction] = useState('CHECK_IN');
  const [equipmentId, setEquipmentId] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [notes, setNotes] = useState('');
  const [photoName, setPhotoName] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);
  const syncingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // { action, assetTag, condition, offline }
  const [snack, setSnack] = useState(null); // { severity, msg }

  const machine = (equipment.data || []).find((m) => m.id === equipmentId);
  const activeAsg = machine?.assignments?.find((a) => a.status === 'ACTIVE');

  function pickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setPhotoName(`photos/${machine?.assetTag || 'asset'}-${stamp}-field.jpg`);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setEquipmentId('');
    setCondition('GOOD');
    setNotes('');
    setPhotoName(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function syncNow() {
    // Guard against concurrent flushes: auto-sync on reconnect and the manual "Sync" pill can both
    // fire, and each reads the same localStorage queue. Without this, two in-flight batch POSTs would
    // send the same events twice (the events API has no idempotency key) → duplicate records.
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const { created, errors } = await flushQueue();
      queryClient.invalidateQueries({ queryKey: ['list'] });
      queryClient.invalidateQueries({ queryKey: ['detail'] });
      if (errors.length) {
        setSnack({
          severity: 'warning',
          msg: `Synced ${created.length}, ${errors.length} failed.`,
        });
      } else if (created.length) {
        setSnack({
          severity: 'success',
          msg: `Synced ${created.length} event${created.length === 1 ? '' : 's'} to the office.`,
        });
      }
    } catch {
      setSnack({ severity: 'error', msg: 'Sync failed. Still queued — try again.' });
    } finally {
      syncingRef.current = false;
    }
  }

  // Auto-sync the moment connectivity is restored, like a real field app would.
  function toggleOnline(next) {
    setOnline(next);
    if (next && queueCount() > 0) syncNow();
  }

  async function submit() {
    if (!machine || !user) return;
    setSubmitting(true);
    const event = {
      type: action,
      // CHECK_OUT hides the condition picker, so don't record a condition it never collected.
      condition: action === 'CHECK_OUT' ? null : condition,
      photoUrl: photoName,
      notes: notes || null,
      equipmentId: machine.id,
      assignmentId: activeAsg?.id || null,
      projectId: activeAsg?.projectId || null,
      userId: user.id,
      occurredAt: new Date().toISOString(),
    };
    try {
      if (online) {
        await api.post('/api/equipment-events', event);
        queryClient.invalidateQueries({ queryKey: ['list'] });
        queryClient.invalidateQueries({ queryKey: ['detail'] });
        setDone({ action, assetTag: machine.assetTag, condition, offline: false });
      } else {
        enqueue(event);
        setDone({ action, assetTag: machine.assetTag, condition, offline: true });
      }
      resetForm();
    } catch (err) {
      setSnack({ severity: 'error', msg: err.message || 'Could not record event.' });
    } finally {
      setSubmitting(false);
    }
  }

  const conditionNeeded = action !== 'CHECK_OUT';
  const canSubmit = Boolean(equipmentId) && !submitting;

  return (
    <Box
      sx={{
        py: 4,
        display: 'flex',
        justifyContent: 'center',
        bgcolor: 'background.default',
        minHeight: '100%',
      }}
    >
      <PhoneFrame online={online}>
        {/* App bar */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Field Check-In
            </Typography>
            <Typography variant="caption" color="text.secondary">
              SubBase Equipment
            </Typography>
          </Box>
          <ConnectionPill online={online} queued={queued} onSync={syncNow} />
        </Stack>

        {/* User switcher (mock auth) */}
        <TextField
          select
          fullWidth
          size="small"
          label="Signed in as"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          sx={{ mb: 1.5 }}
          InputProps={{
            startAdornment: user ? (
              <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: 12, bgcolor: 'primary.main' }}>
                {user.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </Avatar>
            ) : null,
          }}
        >
          {supers.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Offline toggle */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            mb: 2,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: online ? 'success.light' : 'error.light',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {online ? (
              <CloudDoneIcon fontSize="small" color="success" />
            ) : (
              <CloudOffIcon fontSize="small" color="error" />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {online ? 'Online' : 'Offline mode'}
            </Typography>
          </Stack>
          <Switch checked={online} onChange={(e) => toggleOnline(e.target.checked)} size="small" />
        </Stack>

        {done ? (
          <SuccessCard done={done} onNew={() => setDone(null)} />
        ) : (
          <Stack spacing={2}>
            {/* Action picker */}
            <Box>
              <FieldLabel>Action</FieldLabel>
              <Stack direction="row" spacing={1}>
                {ACTIONS.map(({ type, label, Icon }) => (
                  <Button
                    key={type}
                    onClick={() => setAction(type)}
                    variant={action === type ? 'contained' : 'outlined'}
                    color={type === 'DOWN' ? 'error' : 'primary'}
                    fullWidth
                    sx={{ flexDirection: 'column', py: 1, gap: 0.25, lineHeight: 1.1 }}
                  >
                    <Icon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {label}
                    </Typography>
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Machine picker */}
            <Box>
              <FieldLabel>Machine</FieldLabel>
              <TextField
                select
                fullWidth
                size="small"
                placeholder="Scan or select"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
              >
                {(equipment.data || []).map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.assetTag} — {m.name}
                  </MenuItem>
                ))}
              </TextField>
              {machine && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {titleCase(machine.category)} ·{' '}
                  {machine.ownership === 'RENTED' ? 'Rented' : 'Owned'}
                  {activeAsg?.project ? ` · on ${activeAsg.project.name}` : ' · in yard'}
                </Typography>
              )}
            </Box>

            {/* Photo */}
            <Box>
              <FieldLabel>Photo</FieldLabel>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={pickPhoto}
              />
              {photoPreview ? (
                <Box
                  onClick={() => fileRef.current?.click()}
                  sx={{
                    position: 'relative',
                    height: 140,
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    component="img"
                    src={photoPreview}
                    alt="captured"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      px: 1,
                      py: 0.5,
                      bgcolor: 'rgba(0,0,0,0.55)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: '#fff', fontFamily: 'ui-monospace, monospace' }}
                    >
                      {photoName}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Button
                  onClick={() => fileRef.current?.click()}
                  variant="outlined"
                  fullWidth
                  startIcon={<PhotoIcon />}
                  sx={{ py: 1.5, borderStyle: 'dashed' }}
                >
                  Take / attach photo
                </Button>
              )}
            </Box>

            {/* Condition */}
            {conditionNeeded && (
              <Box>
                <FieldLabel>Condition</FieldLabel>
                <Stack direction="row" spacing={1}>
                  {CONDITIONS.map((c) => (
                    <Button
                      key={c}
                      onClick={() => setCondition(c)}
                      variant={condition === c ? 'contained' : 'outlined'}
                      color={c === 'GOOD' ? 'success' : c === 'DAMAGED' ? 'error' : 'warning'}
                      fullWidth
                      size="small"
                      sx={{ py: 0.75 }}
                    >
                      {titleCase(c)}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Notes */}
            <TextField
              label="Notes"
              placeholder="Anything the office should know…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              size="small"
            />

            {/* Submit */}
            <Button
              onClick={submit}
              disabled={!canSubmit}
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              sx={{ py: 1.25 }}
            >
              {submitting ? 'Saving…' : online ? 'Submit' : 'Save offline'}
            </Button>
            {!online && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', mt: -1 }}
              >
                Saved on device. Syncs when you’re back online.
              </Typography>
            )}
          </Stack>
        )}
      </PhoneFrame>

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
    </Box>
  );
}

function FieldLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'text.secondary',
        display: 'block',
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );
}

function ConnectionPill({ online, queued, onSync }) {
  if (queued > 0) {
    return (
      <Button
        onClick={online ? onSync : undefined}
        size="small"
        variant="outlined"
        color={online ? 'primary' : 'warning'}
        startIcon={online ? <CloudSyncIcon fontSize="small" /> : <CloudOffIcon fontSize="small" />}
        sx={{ borderRadius: 5, py: 0.25 }}
      >
        {online ? `Sync ${queued}` : `${queued} queued`}
      </Button>
    );
  }
  return null;
}

function SuccessCard({ done, onNew }) {
  const verb =
    done.action === 'CHECK_OUT'
      ? 'Checked out'
      : done.action === 'CHECK_IN'
        ? 'Checked in'
        : 'Reported down';
  return (
    <Stack spacing={2} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
      <CheckIcon color={done.offline ? 'warning' : 'success'} sx={{ fontSize: 64 }} />
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {verb} {done.assetTag}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {done.action !== 'CHECK_OUT' ? `${titleCase(done.condition)} · ` : ''}
          {done.offline ? 'Saved offline — queued for sync.' : 'Synced to the office.'}
        </Typography>
      </Box>
      <Button onClick={onNew} variant="contained" fullWidth size="large">
        New check-in
      </Button>
    </Stack>
  );
}
