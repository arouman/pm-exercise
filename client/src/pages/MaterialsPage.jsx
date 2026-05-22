import { useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';

import PageHeader from '../components/PageHeader';
import { useEntities } from '../hooks/useEntities';

const CATEGORIES = ['CONCRETE', 'REBAR', 'FASTENERS', 'LUMBER', 'ELECTRICAL', 'TOOLS_RENTAL_EXTERNAL'];
const CATEGORY_LABELS = {
  CONCRETE: 'Concrete',
  REBAR: 'Rebar',
  FASTENERS: 'Fasteners',
  LUMBER: 'Lumber',
  ELECTRICAL: 'Electrical',
  TOOLS_RENTAL_EXTERNAL: 'External Rental',
};

export default function MaterialsPage() {
  const [filter, setFilter] = useState('ALL');
  const { data = [], isLoading } = useEntities('/api/materials');

  const rows = useMemo(() => {
    if (filter === 'ALL') return data;
    return data.filter((m) => m.category === filter);
  }, [data, filter]);

  const columns = [
    {
      field: 'sku',
      headerName: 'SKU',
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ value }) => (
        <Box sx={{ fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace', fontSize: 13 }}>
          {value}
        </Box>
      ),
    },
    { field: 'name', headerName: 'Material', flex: 2, minWidth: 240 },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 160,
      renderCell: ({ value }) => (
        <Chip size="small" label={CATEGORY_LABELS[value] || value} variant="outlined" />
      ),
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (value, row) => row.vendor?.name ?? '—',
    },
    { field: 'unit', headerName: 'Unit', flex: 0.4, minWidth: 70 },
    {
      field: 'unitPrice',
      headerName: 'Price',
      flex: 0.6,
      minWidth: 90,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (v) => `$${v.toFixed(2)}`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Materials"
        subtitle="Every SKU that can appear on a purchase order or in inventory."
      />
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip
          label="All"
          color={filter === 'ALL' ? 'primary' : 'default'}
          onClick={() => setFilter('ALL')}
          variant={filter === 'ALL' ? 'filled' : 'outlined'}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={CATEGORY_LABELS[c]}
            color={filter === c ? 'primary' : 'default'}
            onClick={() => setFilter(c)}
            variant={filter === c ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          getRowId={(r) => r.id}
        />
      </Card>
    </>
  );
}
