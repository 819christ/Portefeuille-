// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Splash from './components/Splash';
import Home from './pages/Home';
import Settings from './pages/Settings';
import History from './pages/History';
import Assistant from './pages/Assistant';
import WalletDetail from './pages/WalletDetail';
import Download from './pages/Download';
import Notifications from './pages/Notifications';
import Tutorial from './components/Tutorial';
import { initDB } from './services/db';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initDB();
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <Splash onComplete={handleSplashComplete} />}
      <Router basename={import.meta.env.BASE_URL}>
        <Tutorial />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wallet-detail/:id" element={<WalletDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/download" element={<Download />} />
          </Routes>
        </Layout>
      </Router>
    </>
  );
}

export default App;
