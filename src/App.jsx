import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import ClaimsPage from './pages/ClaimsPage';
import PremiumsPage from './pages/PremiumsPage';
import SyncIssuesPage from './pages/SyncIssuesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/enrollments" element={<EnrollmentsPage />} />
        <Route path="/claims" element={<ClaimsPage />} />
        <Route path="/premiums" element={<PremiumsPage />} />
        <Route path="/sync-issues" element={<SyncIssuesPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
