import { useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';

import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import DetailDrawer from '../components/DetailDrawer';
import { useEntities } from '../hooks/useEntities';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InventoryPage() {
  const projects = useEntities('/api/projects');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const inventoryPath = projectFilter === 'ALL'
    ? '/api/inventory'
    : `/api/inventory?projectId=${encodeURIComponent(projectFilter)}`;
  const { data = [], isLoading } = useEntities(inventoryPath);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (i) => i.material?.name.toLowerCase().includes(q) || i.material?.sku.toLowerCase().includes(q),
    );
  }, [data, search]);

  const [selected, setSelected] = useState(null);
  const txnsPath = selected
    ? `/api/inventory/transactions?materialId=${selected.materialId}&projectId=${selected.projectId}`
    : null;
  const { data: txns } = useEntities(txnsPath || '/api/inventory/transactions?limit=0', {
    enabled: Boolean(selected),
  });

  const columns = [
    {
      field: 'material',
      headerName: 'Material',
      flex: 2,
      minWidth: 240,
      valueGetter: (v, row) => row.material?.name || '—',
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.material?.name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.material?.sku}</Typography>
        </Box>
      ),
    },
    {
      field: 'project',
      headerName: 'Project',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (v, row) => row.project?.name || '—',
    },
    {
      field: 'quantityOnHand',
      headerName: 'On hand',
      flex: 0.7,
      minWidth: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end" sx={{ width: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.quantityOnHand.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">{row.material?.unit}</Typography>
        </Stack>
      ),
    },
    {
      field: 'lowStock',
      headerName: 'Stock',
      flex: 0.6,
      minWidth: 110,
      sortable: false,
      renderCell: ({ row }) => {
        const low = row.quantityOnHand < 100;
        return <Chip size="small" label={low ? 'Low' : 'OK'} color={low ? 'error' : 'success'} variant={low ? 'filled' : 'outlined'} />;
      },
    },
    {
      field: 'lastUpdatedAt',
      headerName: 'Updated',
      flex: 1,
      minWidth: 140,
      valueFormatter: (v) => fmtDate(v),
    },
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Materialized stock by (material × project). Click a row for the full transaction history."
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="ALL">All projects</MenuItem>
          {projects.data?.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search material"
          placeholder="SKU or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
        />
      </Stack>
      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(p) => setSelected({ materialId: p.row.materialId, projectId: p.row.projectId, item: p.row })}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          getRowId={(r) => r.id}
        />
      </Card>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.item?.material?.name || 'Inventory item'}
        subtitle={selected?.item?.project?.name}
        width={560}
      >
        {selected && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">On hand</Typography>
                <Typography variant="h2" sx={{ lineHeight: 1.1 }}>
                  {selected.item.quantityOnHand.toLocaleString()}{' '}
                  <Typography component="span" variant="body1" color="text.secondary">
                    {selected.item.material?.unit}
                  </Typography>
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">SKU</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, mt: 0.5 }}>
                  {selected.item.material?.sku}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Vendor</Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selected.item.material?.vendor?.name}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Transactions ({txns?.length || 0})
              </Typography>
              {txns?.length ? (
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {txns.map((t) => (
                    <Stack key={t.id} direction="row" alignItems="center" spacing={2} sx={{ py: 1.25 }}>
                      <StatusChip value={t.type} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {t.reference || 'No reference'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.user?.name} · {fmtDate(t.createdAt)}
                          {t.fromProject && ` · from ${t.fromProject.name}`}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {t.type === 'OUT' ? '-' : '+'}{t.quantity.toLocaleString()}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No transactions yet.</Typography>
              )}
            </Box>
          </Stack>
        )}
      </DetailDrawer>
    </>
  );
}
