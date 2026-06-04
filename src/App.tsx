import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { RequestsProvider } from './context/RequestsContext';
import { ChatProvider } from './context/ChatContext';
import { TourProvider } from './context/TourContext';

import { Layout } from './components/layout/Layout';
import { RouteErrorBoundary } from './components/error/RouteErrorBoundary';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setAuthTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthTimedOut(true), 5000);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (isLoading && !authTimedOut) return <div className="flex justify-center p-10">Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

import { NotificationsProvider } from './context/NotificationsContext';
import { ProfessorsProvider } from './context/ProfessorsContext';
import { AnalyticsProvider } from './context/AnalyticsContext';

// ... (previous imports)

import { Toaster } from './components/ui/Toaster';

// Import LandingPage
const Login = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const SearchPage = lazy(() => import('./pages/search/SearchPage').then((m) => ({ default: m.SearchPage })));
const CreateRequestPage = lazy(() => import('./pages/requests/CreateRequestPage').then((m) => ({ default: m.CreateRequestPage })));
const MyRequestsPage = lazy(() => import('./pages/requests/MyRequestsPage').then((m) => ({ default: m.MyRequestsPage })));
const MySubjectsPage = lazy(() => import('./pages/subjects/MySubjectsPage').then((m) => ({ default: m.MySubjectsPage })));
const CorrelativesMapPage = lazy(() => import('./pages/correlativas/CorrelativesMapPage').then((m) => ({ default: m.CorrelativesMapPage })));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const EloTrainingPage = lazy(() => import('./pages/ranking/EloTrainingPage').then((m) => ({ default: m.EloTrainingPage })));
const LeaderboardPage = lazy(() => import('./pages/ranking/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })));
const LandingPage = lazy(() => import('./pages/public/LandingPage').then((m) => ({ default: m.LandingPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const TermsPage = lazy(() => import('./pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const HistoryPage = lazy(() => import('./pages/requests/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const EditRequestPage = lazy(() => import('./pages/requests/EditRequestPage').then((m) => ({ default: m.EditRequestPage })));

const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <CatalogProvider>
      <AuthProvider>
        <NotificationsProvider>
          <RequestsProvider>
            <ChatProvider>
              <ProfessorsProvider>
                <TourProvider>
                  <Router>
                    <AnalyticsProvider> {/* AnalyticsProvider wraps AppContent */}
                      <AppContent />
                    </AnalyticsProvider>
                  </Router>
                </TourProvider>
              </ProfessorsProvider>
            </ChatProvider>
          </RequestsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </CatalogProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Cargando...</div>}>
        <Routes>
          {/* Root Route: Landing if public, Dashboard if auth */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="el Dashboard">
                <Dashboard />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/search" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="la Búsqueda">
                <SearchPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/requests/new" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="Nueva Solicitud">
                <CreateRequestPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/my-requests" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="Mis Solicitudes">
                <MyRequestsPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/requests/edit/:requestId" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="Editar Solicitud">
                <EditRequestPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="el Historial">
                <HistoryPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/mis-materias" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="Mis Materias">
                <MySubjectsPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/mapa-correlativas" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="el Mapa de Correlativas">
                <CorrelativesMapPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="las Notificaciones">
                <NotificationsPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="el Perfil">
                <ProfilePage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/users/:userId" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="el Perfil">
                <ProfilePage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/ranking/vote" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="la Votación">
                <EloTrainingPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/ranking/leaderboard" element={
            <ProtectedRoute>
              <RouteErrorBoundary section="el Leaderboard">
                <LeaderboardPage />
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <RouteErrorBoundary section="el Panel de Administración">
                  <AdminDashboardPage />
                </RouteErrorBoundary>
              </AdminRoute>
            </ProtectedRoute>
          } />

          {/* Public Legal Routes */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </Layout>
  );
}

export default App;
