import React from "react";
import Link from "next/link";
import { Button, Card, Col, Row, Typography, Divider, Carousel } from "antd";
import { ArrowRightOutlined, CloudOutlined, SafetyOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useWeb3, Role } from "../components/Web3Provider";

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const { account, role } = useWeb3();

  // Role-based route redirection
  const getPolicyRedirectRoute = (): string => {
    if (role === Role.Insurer) return "/insurer/InsurerPolicyTemplates";
    if (role === Role.User) return "/user/MyPolicies";
    return "/";
  };

  return (
    <div className="flex flex-col bg-white text-black">
      {/* Hero Section */}
      <Carousel autoplay effect="fade" dotPosition="bottom" className="custom-carousel">
        <div className="hero-section text-center bg-gradient-to-r from-blue-100 to-white py-32">
          <Title level={1} className="text-6xl font-extrabold text-black animate-fadeIn">
            Decentralized Flight Insurance
          </Title>
          <Paragraph className="text-xl text-gray-700 max-w-2xl mx-auto animate-slideIn">
            Instant payouts, transparent claims, and no middlemen. Powered by blockchain technology.
          </Paragraph>

          {account ? (
            <Link href={getPolicyRedirectRoute()}>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                className="animate-pulse bg-blue-500 border-none text-white shadow-lg hover:bg-blue-600"
              >
                {role === Role.Insurer ? "Manage Policies" : "View My Policies"}
              </Button>
            </Link>
          ) : (
            <Button
              type="default"
              size="large"
              icon={<ArrowRightOutlined />}
              className="animate-pulse bg-blue-500 border-none text-white shadow-lg hover:bg-blue-600"
              onClick={() =>
                document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get Started
            </Button>
          )}
        </div>
      </Carousel>

      {/* How It Works Section */}
      <Divider style={{ borderColor: "#2563eb" }}>
        <Title level={2} className="text-3xl font-semibold text-gray-900">
          How It Works
        </Title>
      </Divider>

      <div id="get-started" className="py-20 bg-gray-100 text-center">
        <Paragraph className="text-lg text-gray-600">
          Our decentralized flight insurance platform makes protecting your travels simple and transparent.
        </Paragraph>

        <Row gutter={[32, 32]} justify="center">
          {/* Step 1: Purchase Insurance */}
          <Col xs={24} md={8}>
            <Card
              title="Purchase Insurance"
              className="custom-card bg-white text-black hover:shadow-xl"
            >
              <CloudOutlined style={{ fontSize: 60, color: "#40A9FF" }} />
              <Paragraph>
                Connect your wallet and purchase insurance for your flight by paying a small premium.
              </Paragraph>
            </Card>
          </Col>

          {/* Step 2: Oracle Integration */}
          <Col xs={24} md={8}>
            <Card
              title="Flight Data Oracle"
              className="custom-card bg-white text-black hover:shadow-xl"
            >
              <SafetyOutlined style={{ fontSize: 60, color: "#52C41A" }} />
              <Paragraph>
                Our smart contracts use Chainlink oracles to monitor flight status from reliable data sources.
              </Paragraph>
            </Card>
          </Col>

          {/* Step 3: Auto Payout */}
          <Col xs={24} md={8}>
            <Card
              title="Automatic Payout"
              className="custom-card bg-white text-black hover:shadow-xl"
            >
              <ThunderboltOutlined style={{ fontSize: 60, color: "#FAAD14" }} />
              <Paragraph>
                If your flight is delayed by more than 2 hours, you'll receive an automatic payout to your wallet.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HomePage;
