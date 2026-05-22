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

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function DeliveriesPage() {
  const { data = [], isLoading } = useEntities('/api/deliveries');
  const [selectedId, setSelectedId] = useState(null);
  const { data: detail } = useEntity(selectedId ? `/api/deliveries/${selectedId}` : null);

  const columns = [
    {
      field: 'deliveredAt',
      headerName: 'Date',
      flex: 1,
      minWidth: 180,
      valueFormatter: (v) => fmtDateTime(v),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 120,
      renderCell: ({ value }) => <StatusChip value={value} />,
    },
    {
      field: 'poNumber',
      headerName: 'PO #',
      flex: 0.7,
      minWidth: 110,
      valueGetter: (v, row) => row.purchaseOrder?.poNumber || '—',
      renderCell: ({ value }) => (
        <Box sx={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 600 }}>
          {value}
        </Box>
      ),
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      flex: 1.2,
      minWidth: 180,
      valueGetter: (v, row) => row.purchaseOrder?.vendor?.name || '—',
    },
    {
      field: 'project',
      headerName: 'Project',
      flex: 1.5,
      minWidth: 220,
      valueGetter: (v, row) => row.purchaseOrder?.project?.name || '—',
    },
    {
      field: 'receivedBy',
      headerName: 'Received by',
      flex: 1,
      minWidth: 160,
      valueGetter: (v, row) => row.receivedBy?.name || '—',
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
  ];

  return (
    <>
      <PageHeader
        title="Deliveries"
        subtitle="Material drops received on-site. Click a row for received quantities and notes."
      />
      <Card>
        <DataGrid
          rows={data}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(p) => setSelectedId(p.id)}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[10, 25, 50]}
          getRowId={(r) => r.id}
        />
      </Card>

      <DetailDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detail ? `Delivery for ${detail.purchaseOrder?.poNumber}` : 'Delivery'}
        subtitle={detail ? fmtDateTime(detail.deliveredAt) : null}
        width={560}
      >
        {detail && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={3} alignItems="center">
              <StatusChip value={detail.status} />
              <Box>
                <Typography variant="caption" color="text.secondary">Received by</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {detail.receivedBy?.name}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Vendor</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {detail.purchaseOrder?.vendor?.name}
                </Typography>
              </Box>
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Project
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>{detail.purchaseOrder?.project?.name}</Typography>
            </Box>

            {detail.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>{detail.notes}</Typography>
              </Box>
            )}

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Received items ({detail.lines?.length || 0})
              </Typography>
              {detail.lines?.length ? (
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Material</TableCell>
                        <TableCell align="right">Received</TableCell>
                        <TableCell align="right">Ordered</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.lines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {l.purchaseOrderLine?.material?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {l.purchaseOrderLine?.material?.sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {l.quantityReceived.toLocaleString()} {l.purchaseOrderLine?.material?.unit}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary' }}>
                            {l.purchaseOrderLine?.quantity.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Pending — no items received yet.
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </DetailDrawer>
    </>
  );
}
