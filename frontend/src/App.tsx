import React from 'react';
import './App.css';
import DashboardApp from './dashboard/DashboardApp';
import {AuthProvider, useAuth} from './auth/AuthContext';
import LoginPage from './auth/LoginPage';

// Shows the login screen until a token is present (cookie empty), then the
// dashboard. The token lives in AuthContext, backed by a cookie.
function AuthGate() {
  const {token} = useAuth();
  return token ? <DashboardApp /> : <LoginPage />;
}

// The foundations demo pages (ChartsDemo, MetricsDemo, TableDemo, SearchDemo,
// LayoutsDemo) still live in src/ as a component reference; the app now renders
// the HappyRobot metrics dashboard built on top of those same components.
function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
