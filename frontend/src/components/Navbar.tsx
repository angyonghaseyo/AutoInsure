import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  // Main navbar styles with !important to override existing styles
  const navbarStyle = {
    width: '100% !important',
    display: 'flex !important',
    flexDirection: 'column !important',
    backgroundColor: 'white !important',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1) !important',
    position: 'sticky !important',
    top: '0 !important',
    zIndex: '1000 !important'
  };

  // Container styles
  const containerStyle = {
    width: '100% !important',
    maxWidth: '1280px !important',
    margin: '0 auto !important',
    padding: '0 1rem !important'
  };

  // Navbar content styles
  const navContentStyle = {
    width: '100% !important',
    display: 'flex !important',
    justifyContent: 'space-between !important',
    alignItems: 'center !important',
    padding: '1rem 0 !important',
    height: '64px !important'
  };

  // Logo styles
  const logoStyle = {
    display: 'flex !important',
    alignItems: 'center !important',
    textDecoration: 'none !important'
  };

  const logoTextStyle = {
    color: '#2563eb !important',
    fontWeight: 'bold !important',
    fontSize: '1.25rem !important',
    marginLeft: '0.5rem !important'
  };

  // Nav links container style
  const navLinksStyle = {
    display: 'flex !important',
    alignItems: 'center !important',
    gap: '2rem !important'
  };

  // Individual nav link style
  const getLinkStyle = (isActive) => ({
    color: isActive ? '#2563eb !important' : '#6b7280 !important',
    fontWeight: '500 !important',
    fontSize: '0.875rem !important',
    textDecoration: 'none !important',
    padding: '0.5rem 0 !important'
  });

  // Button style
  const buttonStyle = {
    backgroundColor: '#2563eb !important',
    color: 'white !important',
    border: 'none !important',
    padding: '0.5rem 1rem !important',
    borderRadius: '0.375rem !important',
    fontSize: '0.875rem !important',
    fontWeight: '500 !important',
    display: 'inline-flex !important',
    alignItems: 'center !important',
    marginLeft: '1rem !important',
    cursor: 'pointer !important'
  };

  // Mobile menu button style
  const mobileMenuButtonStyle = {
    display: 'none !important',
    background: 'transparent !important',
    border: 'none !important',
    padding: '0.5rem !important',
    cursor: 'pointer !important'
  };

  // Mobile menu styles
  const mobileMenuStyle = {
    display: isMenuOpen ? 'flex !important' : 'none !important',
    flexDirection: 'column !important',
    width: '100% !important',
    padding: '0.5rem 0 !important',
    backgroundColor: 'white !important',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1) !important',
    border: '1px solid #e5e7eb !important',
    borderTop: 'none !important'
  };

  // Mobile link style
  const mobileLinkStyle = (isActive) => ({
    color: isActive ? '#2563eb !important' : '#374151 !important',
    fontWeight: '500 !important',
    fontSize: '1rem !important',
    textDecoration: 'none !important',
    padding: '0.75rem 1rem !important',
    display: 'block !important',
    width: '100% !important',
    backgroundColor: isActive ? '#eff6ff !important' : 'transparent !important'
  });

  // Mobile button style
  const mobileButtonStyle = {
    ...buttonStyle,
    margin: '0.75rem 1rem !important',
    width: 'calc(100% - 2rem) !important',
    justifyContent: 'center !important',
    marginLeft: '1rem !important'
  };

  // Media query styles (applied in useEffect)
  useEffect(() => {
    const handleResize = () => {
      const mobileNavButton = document.getElementById('mobile-nav-button');
      const desktopLinks = document.getElementById('desktop-links');
      
      if (window.innerWidth < 768) {
        if (mobileNavButton) mobileNavButton.style.display = 'block !important';
        if (desktopLinks) desktopLinks.style.display = 'none !important';
      } else {
        if (mobileNavButton) mobileNavButton.style.display = 'none !important';
        if (desktopLinks) desktopLinks.style.display = 'flex !important';
        setIsMenuOpen(false);
      }
    };

    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav style={navbarStyle}>
      <div style={containerStyle}>
        <div style={navContentStyle}>
          {/* Logo section */}
          <Link href="/" style={logoStyle}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#2563eb" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
            </svg>
            <span style={logoTextStyle}>AutoInsure</span>
          </Link>

          {/* Desktop navigation */}
          <div id="desktop-links" style={navLinksStyle}>
            <Link href="/" style={getLinkStyle(router.pathname === '/')}>
              Home
            </Link>
            <Link href="/policies" style={getLinkStyle(router.pathname === '/policies')}>
              My Policies
            </Link>
            <Link href="/claim" style={getLinkStyle(router.pathname === '/claim')}>
              Claim
            </Link>

            {/* Connect wallet button */}
            <button style={buttonStyle}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{marginRight: '0.5rem'}}
              >
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
              </svg>
              Connect Wallet
            </button>
          </div>

          {/* Mobile menu button */}
          <button 
            id="mobile-nav-button"
            style={{...mobileMenuButtonStyle, display: 'none'}} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div style={mobileMenuStyle}>
        <Link href="/" style={mobileLinkStyle(router.pathname === '/')}>
          Home
        </Link>
        <Link href="/policies" style={mobileLinkStyle(router.pathname === '/policies')}>
          My Policies
        </Link>
        <Link href="/claim" style={mobileLinkStyle(router.pathname === '/claim')}>
          Claim
        </Link>
        <button style={mobileButtonStyle}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{marginRight: '0.5rem'}}
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
          </svg>
          Connect Wallet
        </button>
      </div>
    </nav>
  );
};

export default Navbar;