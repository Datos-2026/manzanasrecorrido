import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleGuard from '../components/RoleGuard';
import Layout from '../components/Layout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import UsersPage from '../pages/UsersPage';
import CommunesPage from '../pages/CommunesPage';
import BlocksPage from '../pages/BlocksPage';
import AssignmentsPage from '../pages/AssignmentsPage';
import MyBlocksPage from '../pages/MyBlocksPage';
import NewVisitPage from '../pages/NewVisitPage';
import VisitsPage from '../pages/VisitsPage';
import VisitDetailPage from '../pages/VisitDetailPage';
import SurveyRoundPage from '../pages/SurveyRoundPage';
import NotFoundPage from '../pages/NotFoundPage';
import MorePage from '../pages/MorePage';
import { useAuth } from '../hooks/useAuth';
import { canViewDashboard, isRecorredor } from '../utils/roles';

function HomeRedirect() {
  const { user } = useAuth();
  if (isRecorredor(user)) return <Navigate to="/mis-manzanas" replace />;
  if (canViewDashboard(user)) return <DashboardPage />;
  return <Navigate to="/recorridos" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route
              path="usuarios"
              element={
                <RoleGuard roles={['admin', 'coordinador']}>
                  <UsersPage />
                </RoleGuard>
              }
            />
            <Route
              path="comunas"
              element={
                <RoleGuard roles={['admin']}>
                  <CommunesPage />
                </RoleGuard>
              }
            />
            <Route
              path="manzanas"
              element={
                <RoleGuard roles={['admin', 'coordinador']}>
                  <BlocksPage />
                </RoleGuard>
              }
            />
            <Route
              path="asignaciones"
              element={
                <RoleGuard roles={['admin', 'coordinador']}>
                  <AssignmentsPage />
                </RoleGuard>
              }
            />
            <Route
              path="mis-manzanas"
              element={
                <RoleGuard roles={['recorredor']}>
                  <MyBlocksPage />
                </RoleGuard>
              }
            />
            <Route path="mas" element={<MorePage />} />
            <Route path="recorridos" element={<VisitsPage />} />
            <Route path="recorridos/nuevo" element={<NewVisitPage />} />
            <Route path="recorridos/:id" element={<VisitDetailPage />} />
            <Route path="relevamientos/:id" element={<SurveyRoundPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


