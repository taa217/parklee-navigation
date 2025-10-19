import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './authentication/AuthProvider';
import ProtectedRoute from './authentication/RouteProtector';

import Login from './authentication/login';
import SignUp from './authentication/signUp';
import Dashboard from './lib/pages/Dashboard';
import ParkingDashboard from './components/ParkingDashboard';
import ParkingMap from './components/ParkingMap';
import ZoneDetails from './components/ZoneDetails';
import EventAlerts from './components/EventAlerts';
import QuickActions from './components/QuickActions';
import Reservations from './components/Reservations';
import Events from './components/EventAlerts';
import SettingsPage from './components/Settings';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Protected routes with nested routing */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          {/* Redirect /dashboard to default dashboard page */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Nested routes rendered inside Dashboard's <Outlet /> */}
          <Route path="dashboard" element={<ParkingDashboard />} />
          <Route path="map" element={<ParkingMap />} />
          <Route path="zones/:zoneId" element={<ZoneDetails />} />
          <Route path="events" element={<Events/>} />
          <Route path="reservations" element={<Reservations />} />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
