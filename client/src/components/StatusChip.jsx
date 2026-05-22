import Chip from '@mui/material/Chip';

// Maps any known status string to a semantic color + readable label.
// Single source of truth so PO/Delivery/Project statuses look consistent across the app.

const COLOR_MAP = {
  // PurchaseOrder
  DRAFT: { color: 'default', label: 'Draft' },
  SUBMITTED: { color: 'info', label: 'Submitted' },
  PARTIALLY_RECEIVED: { color: 'warning', label: 'Partial' },
  RECEIVED: { color: 'success', label: 'Received' },
  CLOSED: { color: 'default', label: 'Closed' },
  // Delivery
  PENDING: { color: 'info', label: 'Pending' },
  PARTIAL: { color: 'warning', label: 'Partial' },
  COMPLETE: { color: 'success', label: 'Complete' },
  // Project
  ACTIVE: { color: 'success', label: 'Active' },
  COMPLETED: { color: 'default', label: 'Completed' },
  ON_HOLD: { color: 'error', label: 'On Hold' },
  // Transactions
  IN: { color: 'success', label: 'In' },
  OUT: { color: 'warning', label: 'Out' },
  TRANSFER: { color: 'info', label: 'Transfer' },
};

export default function StatusChip({ value, size = 'small' }) {
  const spec = COLOR_MAP[value] || { color: 'default', label: value };
  return <Chip size={size} color={spec.color} label={spec.label} variant="filled" sx={{ minWidth: 80 }} />;
}
