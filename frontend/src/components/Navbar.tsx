// components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import WalletConnect from './WalletConnect';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const isActive = (path: string) => {
    return router.pathname === path;
  };
  
  return (
    <nav className={`sticky top-0 z-50 transition duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">FlightGuard</span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                href="/"
                className={`border-transparent hover:text-blue-600 hover:border-blue-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-blue-600 border-blue-500' : 'text-gray-500 border-transparent'
                }`}
              >
                Home
              </Link>
              <Link
                href="/policies"
                className={`border-transparent hover:text-blue-600 hover:border-blue-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/policies') ? 'text-blue-600 border-blue-500' : 'text-gray-500 border-transparent'
                }`}
              >
                My Policies
              </Link>
              <Link
                href="/claim"
                className={`border-transparent hover:text-blue-600 hover:border-blue-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/claim') ? 'text-blue-600 border-blue-500' : 'text-gray-500 border-transparent'
                }`}
              >
                Claim
              </Link>
            </div>
          </div>
          
          {/* Wallet connect button */}
          <div className="hidden md:flex md:items-center">
            <WalletConnect />
          </div>
          
          {/* Mobile menu button with smaller icons */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="block h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg border-t">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block pl-3 pr-4 py-2 border-l-4 font-medium ${
                isActive('/') 
                  ? 'border-blue-500 text-blue-700 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/policies"
              className={`block pl-3 pr-4 py-2 border-l-4 font-medium ${
                isActive('/policies') 
                  ? 'border-blue-500 text-blue-700 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              My Policies
            </Link>
            <Link
              href="/claim"
              className={`block pl-3 pr-4 py-2 border-l-4 font-medium ${
                isActive('/claim') 
                  ? 'border-blue-500 text-blue-700 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Claim
            </Link>
            <div className="py-4 px-3">
              <WalletConnect />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;