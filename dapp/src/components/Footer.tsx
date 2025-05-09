import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const CustomFooter = () => {
  const currentYear: number = new Date().getFullYear();

  return (
    <Footer style={{ background: 'transparent', padding: '20px 0', textAlign: 'center' }}>
      <div className="footer-bottom" style={{ fontSize: '14px', color: '#666' }}>
        <p>&copy; {currentYear} AutoInsure. All rights reserved.</p>
        <p>Powered by Ethereum, Chainlink, and Next.js.</p>
      </div>
    </Footer>
  );
};

export default CustomFooter;
