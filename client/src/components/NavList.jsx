import { NavLink } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import ProjectsIcon from '@mui/icons-material/ConstructionOutlined';
import POIcon from '@mui/icons-material/ReceiptLongOutlined';
import DeliveryIcon from '@mui/icons-material/LocalShippingOutlined';
import InventoryIcon from '@mui/icons-material/InventoryOutlined';
import MaterialsIcon from '@mui/icons-material/CategoryOutlined';
import VendorsIcon from '@mui/icons-material/StoreOutlined';
import RentalsIcon from '@mui/icons-material/InsightsOutlined';
import EquipmentIcon from '@mui/icons-material/PrecisionManufacturingOutlined';

// Two groups: the existing procurement app, and the new Rentals wedge. Schedule + Field views
// land in Milestone 4 and get added here then.
const groups = [
  {
    items: [
      { to: '/', label: 'Dashboard', Icon: DashboardIcon },
      { to: '/projects', label: 'Projects', Icon: ProjectsIcon },
      { to: '/purchase-orders', label: 'Purchase Orders', Icon: POIcon },
      { to: '/deliveries', label: 'Deliveries', Icon: DeliveryIcon },
      { to: '/inventory', label: 'Inventory', Icon: InventoryIcon },
      { to: '/materials', label: 'Materials', Icon: MaterialsIcon },
      { to: '/vendors', label: 'Vendors', Icon: VendorsIcon },
    ],
  },
  {
    heading: 'Rentals',
    items: [
      { to: '/rentals', label: 'Rentals', Icon: RentalsIcon },
      { to: '/equipment', label: 'Equipment', Icon: EquipmentIcon },
    ],
  },
];

export default function NavList({ onNavigate }) {
  return (
    <List sx={{ py: 1.5 }}>
      {groups.map((group, gi) => (
        <li key={group.heading || `group-${gi}`} style={{ listStyle: 'none' }}>
          <List
            disablePadding
            subheader={
              group.heading ? (
                <ListSubheader
                  disableSticky
                  sx={{
                    bgcolor: 'transparent',
                    color: 'text.secondary',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    lineHeight: 2.5,
                    mt: 1,
                  }}
                >
                  {group.heading}
                </ListSubheader>
              ) : null
            }
          >
            {group.items.map(({ to, label, Icon }) => (
              <ListItem key={to} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={to}
                  end={to === '/'}
                  onClick={onNavigate}
                  sx={({ palette }) => ({
                    '&.active': {
                      backgroundColor: 'rgba(59, 91, 219, 0.08)',
                      color: palette.primary.main,
                      '& .MuiListItemIcon-root': { color: palette.primary.main },
                    },
                  })}
                >
                  <ListItemIcon>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </li>
      ))}
    </List>
  );
}
