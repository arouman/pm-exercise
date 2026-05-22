import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import DashboardPage from './pages/DashboardPage';
import VendorsPage from './pages/VendorsPage';
import MaterialsPage from './pages/MaterialsPage';
import ProjectsPage from './pages/ProjectsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import DeliveriesPage from './pages/DeliveriesPage';
import InventoryPage from './pages/InventoryPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
