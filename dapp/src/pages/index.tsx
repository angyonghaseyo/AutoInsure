import React, { useState } from "react";
import Link from "next/link";
import { Button, Card, Col, Row, Typography, Divider, Alert } from "antd";
import { ArrowRightOutlined, CloudOutlined, GiftOutlined } from "@ant-design/icons";
import { useWeb3, Role } from "../components/Web3Provider";

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const { account, role, connectWallet } = useWeb3();
  const [showConnectError, setShowConnectError] = useState(false);

  // Role-based route redirection
  const getPolicyRedirectRoute = (): string => {
    if (role === Role.Insurer) return "/insurer/InsurerPolicyTemplates";
    if (role === Role.User) return "/user/MyPolicies";
    return "/";
  };

  // Handle Get Started button click
  const handleGetStarted = async () => {
    if (!account) {
      try {
        await connectWallet();
      } catch (error) {
        setShowConnectError(true);
      }
    } else {
      // Redirect based on user role
      window.location.href = getPolicyRedirectRoute();
    }
  };

  return (
    <div className="flex flex-col bg-white text-black">
      {/* Hero Section */}
      <div className="hero-section text-center bg-gradient-to-r from-blue-100 to-white py-32">
        <Title level={1} className="text-6xl font-extrabold text-black">
          Decentralized Travel Insurance
        </Title>
        <Paragraph className="text-xl text-gray-700 max-w-2xl mx-auto">
          Instant payouts, transparent claims, and no middlemen. Protect your travel against flight delays and baggage loss, powered by blockchain technology.
        </Paragraph>

        {account ? (
          <Link href={getPolicyRedirectRoute()}>
            <Button type="primary" size="large" icon={<ArrowRightOutlined />} className="animate-pulse bg-blue-500 border-none text-white shadow-lg hover:bg-blue-600">
              {role === Role.Insurer ? "Manage Policies" : "View My Policies"}
            </Button>
          </Link>
        ) : (
          <>
            <Button
              type="default"
              size="large"
              icon={<ArrowRightOutlined />}
              className="animate-pulse bg-blue-500 border-none text-white shadow-lg hover:bg-blue-600"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
            {showConnectError && <Alert message="Connection Error" description="Unable to connect to your wallet. Please try again." type="error" showIcon className="mt-4" />}
          </>
        )}
      </div>

      {/* How It Works Section */}
      <Divider style={{ borderColor: "#2563eb" }}>
        <Title level={2} className="text-3xl font-semibold text-gray-900">
          How It Works
        </Title>
      </Divider>

      <div className="py-20 bg-gray-100 text-center">
        <Paragraph className="text-lg text-gray-600">Our decentralized travel insurance platform makes protecting your travels simple and transparent.</Paragraph>

        <Row gutter={[32, 32]} justify="center">
          {/* Flight Delay Section */}
          <Col xs={24} md={8}>
            <Card title="Flight Delay" className="custom-card bg-white text-black hover:shadow-xl">
              <CloudOutlined style={{ fontSize: 60, color: "#40A9FF" }} />
              <Paragraph>Protect yourself from flight delays. If your flight is delayed beyond the threshold, you can claim a payout directly to your wallet.</Paragraph>
            </Card>
          </Col>

          {/* Baggage Loss Section */}
          <Col xs={24} md={8}>
            <Card title="Baggage Loss" className="custom-card bg-white text-black hover:shadow-xl">
              <GiftOutlined style={{ fontSize: 60, color: "#52C41A" }} />
              <Paragraph>
                Ensure compensation for baggage loss or delay. Get coverage for lost baggage and reimbursement for delayed essentials like toiletries and clothes.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HomePage;
