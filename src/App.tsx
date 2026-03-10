import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { RequestsProvider } from './context/RequestsContext';
import { ChatProvider } from './context/ChatContext';
import { TourProvider } from './context/TourContext';

import { Layout } from './components/layout/Layout';
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
                    <AppContent />
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

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/search" element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          } />

          <Route path="/requests/new" element={
            <ProtectedRoute>
              <CreateRequestPage />
            </ProtectedRoute>
          } />

          <Route path="/my-requests" element={
            <ProtectedRoute>
              <MyRequestsPage />
            </ProtectedRoute>
          } />

          <Route path="/mis-materias" element={
            <ProtectedRoute>
              <MySubjectsPage />
            </ProtectedRoute>
          } />

          <Route path="/mapa-correlativas" element={
            <ProtectedRoute>
              <CorrelativesMapPage />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/users/:userId" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/ranking/vote" element={
            <ProtectedRoute>
              <EloTrainingPage />
            </ProtectedRoute>
          } />
          <Route path="/ranking/leaderboard" element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </Layout>
  );
}

export default App;
