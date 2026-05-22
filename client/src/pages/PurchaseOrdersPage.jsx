import { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import DetailDrawer from '../components/DetailDrawer';
import { useEntities, useEntity } from '../hooks/useEntities';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtMoney(n) {
  return n?.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function PurchaseOrdersPage() {
  const { data = [], isLoading } = useEntities('/api/purchase-orders');
  const [selectedId, setSelectedId] = useState(null);
  const { data: detail } = useEntity(selectedId ? `/api/purchase-orders/${selectedId}` : null);

  const columns = [
    {
      field: 'poNumber',
      headerName: 'PO #',
      flex: 0.7,
      minWidth: 110,
      renderCell: ({ value }) => (
        <Box sx={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 600 }}>
          {value}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 130,
      renderCell: ({ value }) => <StatusChip value={value} />,
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (v, row) => row.vendor?.name || '—',
    },
    {
      field: 'project',
      headerName: 'Project',
      flex: 1.5,
      minWidth: 220,
      valueGetter: (v, row) => row.project?.name || '—',
    },
    {
      field: 'lines',
      headerName: 'Lines',
      flex: 0.4,
      minWidth: 70,
      valueGetter: (v, row) => row._count?.lines ?? 0,
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 0.7,
      minWidth: 110,
      valueFormatter: (v) => fmtMoney(v),
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'expectedDelivery',
      headerName: 'Expected',
      flex: 0.8,
      minWidth: 130,
      valueFormatter: (v) => fmtDate(v),
    },
  ];

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        subtitle="All orders raised against vendors. Click any row for line items and delivery history."
      />
      <Card>
        <DataGrid
          rows={data}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(p) => setSelectedId(p.id)}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'poNumber', sort: 'desc' }] },
          }}
          pageSizeOptions={[10, 25, 50]}
          getRowId={(r) => r.id}
        />
      </Card>

      <DetailDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detail?.poNumber || 'Purchase Order'}
        subtitle={detail ? `${detail.vendor?.name} · ${detail.project?.name}` : null}
        width={560}
      >
        {detail && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={3} alignItems="center">
              <StatusChip value={detail.status} />
              <Box>
                <Typography variant="caption" color="text.secondary">Total</Typography>
                <Typography variant="h3" sx={{ lineHeight: 1.1 }}>{fmtMoney(detail.total)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Expected</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {fmtDate(detail.expectedDelivery)}
                </Typography>
              </Box>
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Created by
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {detail.createdBy?.name} <Typography component="span" variant="caption" color="text.secondary">on {fmtDate(detail.createdAt)}</Typography>
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>Line items ({detail.lines?.length || 0})</Typography>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.lines?.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{l.material?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{l.material?.sku} · {l.material?.unit}</Typography>
                        </TableCell>
                        <TableCell align="right">{l.quantity.toLocaleString()}</TableCell>
                        <TableCell align="right">{fmtMoney(l.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtMoney(l.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>

            {detail.deliveries?.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Deliveries ({detail.deliveries.length})
                </Typography>
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {detail.deliveries.map((d) => (
                    <Stack key={d.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.25 }} spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {fmtDate(d.deliveredAt)} · received by {d.receivedBy?.name}
                        </Typography>
                        {d.notes && (
                          <Typography variant="caption" color="text.secondary">{d.notes}</Typography>
                        )}
                      </Box>
                      <StatusChip value={d.status} />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </DetailDrawer>
    </>
  );
}
