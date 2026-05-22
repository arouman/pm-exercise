import { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';

import PageHeader from '../components/PageHeader';
import DetailDrawer from '../components/DetailDrawer';
import { useEntities, useEntity } from '../hooks/useEntities';

const CATEGORY_LABELS = {
  CONCRETE: 'Concrete',
  REBAR: 'Rebar',
  FASTENERS: 'Fasteners',
  LUMBER: 'Lumber',
  ELECTRICAL: 'Electrical',
  TOOLS_RENTAL_EXTERNAL: 'Tools / External Rental',
};

export default function VendorsPage() {
  const { data = [], isLoading } = useEntities('/api/vendors');
  const [selectedId, setSelectedId] = useState(null);
  const { data: detail } = useEntity(selectedId ? `/api/vendors/${selectedId}` : null);

  const columns = [
    { field: 'name', headerName: 'Vendor', flex: 2, minWidth: 220 },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Chip size="small" label={CATEGORY_LABELS[params.value] || params.value} variant="outlined" />
      ),
    },
    { field: 'contactEmail', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { field: 'contactPhone', headerName: 'Phone', flex: 1, minWidth: 140 },
    { field: 'paymentTerms', headerName: 'Terms', flex: 0.8, minWidth: 100 },
    {
      field: '_count',
      headerName: 'Materials',
      flex: 0.6,
      minWidth: 100,
      valueGetter: (value, row) => row._count?.materials ?? 0,
      align: 'right',
      headerAlign: 'right',
    },
  ];

  return (
    <>
      <PageHeader
        title="Vendors"
        subtitle="External suppliers SubBase customers order from."
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
        title={detail?.name || 'Vendor'}
        subtitle={detail ? CATEGORY_LABELS[detail.category] : null}
      >
        {detail && (
          <Stack spacing={3}>
            <DetailField label="Contact email" value={
              <Link href={`mailto:${detail.contactEmail}`}>{detail.contactEmail}</Link>
            } />
            <DetailField label="Contact phone" value={detail.contactPhone} />
            <DetailField label="Payment terms" value={detail.paymentTerms} />
            <DetailField
              label="Purchase orders to date"
              value={detail._count?.purchaseOrders ?? 0}
            />

            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>Materials catalog ({detail.materials?.length || 0})</Typography>
              <Divider />
              {detail.materials?.length ? (
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {detail.materials.map((m) => (
                    <Stack key={m.id} direction="row" alignItems="center" sx={{ py: 1 }} spacing={1}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{m.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.sku} · {m.unit}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${m.unitPrice.toFixed(2)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No materials linked to this vendor.
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </DetailDrawer>
    </>
  );
}

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ mt: 0.5 }}>{value}</Typography>
    </Box>
  );
}
