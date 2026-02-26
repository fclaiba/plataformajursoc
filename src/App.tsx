import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequestsProvider } from './context/RequestsContext';
import { ChatProvider } from './context/ChatContext';
import { TourProvider } from './context/TourContext';

import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { SearchPage } from './pages/search/SearchPage';
import { CreateRequestPage } from './pages/requests/CreateRequestPage';
import { MyRequestsPage } from './pages/requests/MyRequestsPage';
import { MySubjectsPage } from './pages/subjects/MySubjectsPage';
import { CorrelativesMapPage } from './pages/correlativas/CorrelativesMapPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="flex justify-center p-10">Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

import { NotificationsProvider } from './context/NotificationsContext';
import { ProfessorsProvider } from './context/ProfessorsContext';
import { EloTrainingPage } from './pages/ranking/EloTrainingPage';
import { LeaderboardPage } from './pages/ranking/LeaderboardPage';

// ... (previous imports)

import { Toaster } from './components/ui/Toaster';

// Import LandingPage
import { LandingPage } from './pages/public/LandingPage';

function App() {
  return (
    <NotificationsProvider>
      <AuthProvider>
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
      </AuthProvider>
    </NotificationsProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <Layout>
      <Routes>
        {/* Root Route: Landing if public, Dashboard if auth */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Layout>
  );
}

export default App;
