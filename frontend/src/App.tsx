import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Web3Provider from './components/Web3Provider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/index';
import PoliciesPage from './pages/policies';
import ClaimPage from './pages/claim';

const App: React.FC = () => {
  return (
    <Web3Provider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/claim" element={<ClaimPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Web3Provider>
  );
};

export default App;