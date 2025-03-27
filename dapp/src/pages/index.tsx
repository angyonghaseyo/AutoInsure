import React from 'react';
import Link from 'next/link';
import { Button, Card, Col, Row, Typography, Alert, Divider, Carousel } from 'antd';
import { useWeb3 } from '../components/Web3Provider';
import BrowsePolicies from './policies';
import { ArrowRightOutlined, CheckCircleOutlined, WalletOutlined, ExclamationCircleOutlined, CloudOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const { account, network } = useWeb3();

  return (
    <div className="flex flex-col bg-white text-black">
      {/* Hero Section with Carousel */}
      <Carousel autoplay effect="fade" dotPosition="bottom" className="custom-carousel">
        <div className="hero-section text-center bg-gradient-to-r from-blue-100 to-white py-32 relative">
          <Title level={1} className="text-black animate-fadeIn text-6xl font-extrabold">
            Decentralized Flight Insurance
          </Title>
          <Paragraph className="text-gray-700 text-xl max-w-2xl mx-auto animate-slideIn">
            Instant payouts, transparent claims, and no middlemen. Powered by blockchain technology.
          </Paragraph>
          {account ? (
            <Link href="/policies">
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                className="animate-pulse bg-blue-500 border-none text-white shadow-lg hover:bg-blue-600"
              >
                View My Policies
              </Button>
            </Link>
          ) : (
            <Button
              type="default"
              size="large"
              icon={<ArrowRightOutlined />}
              className="animate-pulse bg-blue-500 border-none text-white shadow-lg hover:bg-blue-600"
              onClick={() => {
                document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get Started
            </Button>
          )}
        </div>
      </Carousel>

      <Divider style={{ borderColor: '#2563eb' }}>
        <Title level={2} className="text-gray-900 text-3xl font-semibold">How It Works</Title>
      </Divider>

      <div className="py-20 bg-gray-100 text-center text-black">
        <Paragraph className="text-gray-600 text-lg">
          Our decentralized flight insurance platform makes protecting your travels simple and transparent.
        </Paragraph>
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} md={8}>
            <Card title="Purchase Insurance" bordered={false} className="custom-card bg-white text-black hover:shadow-xl">
              <CloudOutlined style={{ fontSize: '60px', color: '#40A9FF' }} />
              <Paragraph>Connect your wallet and purchase insurance for your flight by paying a small premium.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Flight Data Oracle" bordered={false} className="custom-card bg-white text-black hover:shadow-xl">
              <SafetyOutlined style={{ fontSize: '60px', color: '#52C41A' }} />
              <Paragraph>Our smart contracts use Chainlink oracles to monitor flight status from reliable data sources.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Automatic Payout" bordered={false} className="custom-card bg-white text-black hover:shadow-xl">
              <ThunderboltOutlined style={{ fontSize: '60px', color: '#FAAD14' }} />
              <Paragraph>If your flight is delayed by more than 2 hours, you'll receive an automatic payout to your wallet.</Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      <Divider style={{ borderColor: '#2563eb' }}>
        <Title level={2} className="text-gray-900 text-3xl font-semibold">Available Policies</Title>
      </Divider>

      {/* <div id="get-started" className="py-20 bg-white text-center text-black">
        <div className="max-w-6xl mx-auto">
          <BrowsePolicies />
        </div>
      </div> */}
    </div>
  );
};

export default HomePage;
