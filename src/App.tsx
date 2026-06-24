import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import screens
import LandingPage from './screens/Landing';
import HomePage from './screens/Home';
import SpareParts from './screens/module1/SparePartsHome';
import PortOperations from './screens/module2/PortOperationsHome';
import DecisionSupport from './screens/module3/DecisionSupportHome';
import VesselProfile from './screens/VesselProfile';
import CertificateVault from './screens/CertificateVault';
import CrewManagement from './screens/CrewManagement';
import Alerts from './screens/Alerts';
import Settings from './screens/Settings';

// Navigation Component
const Navigation = ({ isLoggedIn, onLogout }: { isLoggedIn: boolean; onLogout: () => void }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (!isLoggedIn) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-navy-900 border-b border-gold-400 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/home')}
        >
          <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
            <span className="text-navy-900 font-bold text-lg">⚓</span>
          </div>
          <div>
            <div className="text-white font-bold text-lg">NAUXIMAR</div>
            <div className="text-gold-400 text-xs">Maritime Intelligence</div>
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 items-center">
          <NavLink label="Home" onClick={() => navigate('/home')} />
          <NavLink label="Spare Parts" onClick={() => navigate('/spare-parts')} />
          <NavLink label="Port Operations" onClick={() => navigate('/port-operations')} />
          <NavLink label="Decision Support" onClick={() => navigate('/decision-support')} />
          <NavLink label="Vessel Data" onClick={() => navigate('/vessel-profile')} />
          <NavLink label="Alerts" onClick={() => navigate('/alerts')} />
          <NavLink label="Settings" onClick={() => navigate('/settings')} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="text-white hover:text-gold-400 flex items-center gap-2"
          >
            <LogOut size={18} />
          </motion.button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gold-400"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-navy-800 border-t border-gold-400"
          >
            <div className="flex flex-col gap-4 p-4">
              <MobileNavLink label="Home" onClick={() => { navigate('/home'); setMobileMenuOpen(false); }} />
              <MobileNavLink label="Spare Parts" onClick={() => { navigate('/spare-parts'); setMobileMenuOpen(false); }} />
              <MobileNavLink label="Port Operations" onClick={() => { navigate('/port-operations'); setMobileMenuOpen(false); }} />
              <MobileNavLink label="Decision Support" onClick={() => { navigate('/decision-support'); setMobileMenuOpen(false); }} />
              <MobileNavLink label="Vessel Data" onClick={() => { navigate('/vessel-profile'); setMobileMenuOpen(false); }} />
              <MobileNavLink label="Alerts" onClick={() => { navigate('/alerts'); setMobileMenuOpen(false); }} />
              <MobileNavLink label="Settings" onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }} />
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="text-white text-left hover:text-gold-400 py-2"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const NavLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <motion.button
    whileHover={{ color: '#FFD700' }}
    onClick={onClick}
    className="text-white text-sm font-medium transition-colors"
  >
    {label}
  </motion.button>
);

const MobileNavLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-white text-left hover:text-gold-400 py-2"
  >
    {label}
  </button>
);

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/home');
  };

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      <AnimatePresence mode="wait">
        <Routes>
          {/* Landing Page */}
          <Route 
            path="/" 
            element={<LandingPage onEnter={handleLogin} />} 
          />

          {/* Main Screens (require login) */}
          {isLoggedIn && (
            <>
              <Route path="/home" element={<HomePage />} />
              
              {/* Module 1: Spare Parts */}
              <Route path="/spare-parts" element={<SpareParts />} />
              
              {/* Module 2: Port Operations */}
              <Route path="/port-operations" element={<PortOperations />} />
              
              {/* Module 3: Decision Support */}
              <Route path="/decision-support" element={<DecisionSupport />} />
              
              {/* Common Screens */}
              <Route path="/vessel-profile" element={<VesselProfile />} />
              <Route path="/certificate-vault" element={<CertificateVault />} />
              <Route path="/crew-management" element={<CrewManagement />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </>
          )}
        </Routes>
      </AnimatePresence>
    </div>
  );
}

// Root component with Router
export function RootApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
