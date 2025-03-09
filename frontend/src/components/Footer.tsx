// components/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { Twitter, Github, Globe, Mail, Shield } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Branding section */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center text-xl font-bold text-white">
              <Shield className="h-3 w-3 mr-2 text-blue-400" />
              FlightGuard
            </Link>
            <p className="mt-3 text-gray-400 text-sm">
              Decentralized flight insurance powered by blockchain technology and Chainlink oracles.
            </p>
            <div className="mt-4 flex space-x-4">
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-3 w-3" />
              </a>
              <a
                href="https://example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-teal-400 transition-colors"
                aria-label="Website"
              >
                <Globe className="h-3 w-3" />
              </a>
              <a
                href="mailto:contact@example.com"
                className="text-gray-400 hover:text-red-400 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-3 w-3" />
              </a>
            </div>
          </div>
          
          {/* Navigation section */}
          <div className="col-span-1">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Navigation</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/policies" className="text-gray-400 hover:text-white transition-colors text-sm">
                  My Policies
                </Link>
              </li>
              <li>
                <Link href="/claim" className="text-gray-400 hover:text-white transition-colors text-sm">
                  File a Claim
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources section */}
          <div className="col-span-1">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h2>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://docs.chain.link/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Chainlink Docs
                </a>
              </li>
              <li>
                <a
                  href="https://ethereum.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Ethereum
                </a>
              </li>
              <li>
                <a
                  href="https://metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  MetaMask
                </a>
              </li>
              <li>
                <a
                  href="https://etherscan.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Etherscan
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support section */}
          <div className="col-span-1">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="mailto:support@example.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} FlightGuard. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center md:text-left">
            Powered by Ethereum, Chainlink, and Next.js. Not affiliated with any airline or insurance provider.
            Blockchain transactions may take time to process. Use at your own risk.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;