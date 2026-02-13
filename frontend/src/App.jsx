import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SpeciesPage from './pages/SpeciesPage';
import FarmsPage from './pages/FarmsPage';
import TanksPage from './pages/TanksPage';
import BatchesPage from './pages/BatchesPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import ShipmentsPage from './pages/ShipmentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WaterLogPage from './pages/WaterLogPage';
import FeedingLogPage from './pages/FeedingLogPage';
import HealthLogPage from './pages/HealthLogPage';
import BatchFinancialsPage from './pages/BatchFinancialsPage';

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/species" element={<SpeciesPage />} />
                <Route path="/farms" element={<FarmsPage />} />
                <Route path="/tanks" element={<TanksPage />} />
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/shipments" element={<ShipmentsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/water-logs" element={<WaterLogPage />} />
                <Route path="/feeding-logs" element={<FeedingLogPage />} />
                <Route path="/health-logs" element={<HealthLogPage />} />
                <Route path="/batch-financials" element={<BatchFinancialsPage />} />
            </Route>
        </Routes>
    );
}
