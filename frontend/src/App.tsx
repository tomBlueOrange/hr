import React from 'react';
import './App.css';
import DashboardApp from './dashboard/DashboardApp';

// The foundations demo pages (ChartsDemo, MetricsDemo, TableDemo, SearchDemo,
// LayoutsDemo) still live in src/ as a component reference; the app now renders
// the HappyRobot metrics dashboard built on top of those same components.
function App() {
  return <DashboardApp />;
}

export default App;
