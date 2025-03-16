import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Grid } from 'antd';
import { DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Sample Policies Catalogue
const samplePolicies = [
  {
    id: 1,
    name: "Basic Flight Delay Cover",
    premium: "0.03 ETH",
    payoutAmount: "0.09 ETH",
    delayThreshold: 60,
  },
  {
    id: 2,
    name: "Standard Flight Protection",
    premium: "0.05 ETH",
    payoutAmount: "0.15 ETH",
    delayThreshold: 90,
  },
  {
    id: 3,
    name: "Premium Travel Assurance",
    premium: "0.07 ETH",
    payoutAmount: "0.21 ETH",
    delayThreshold: 120,
  },
  {
    id: 4,
    name: "VIP Flight Insurance",
    premium: "0.1 ETH",
    payoutAmount: "0.3 ETH",
    delayThreshold: 150,
  },
];

const BrowsePolicies: React.FC = () => {
  const screens = useBreakpoint();
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null);

  const handlePurchase = (id: number) => {
    console.log(`Purchasing policy ID: ${id}`);
    // Redirect or open modal for purchasing process
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Title level={2} style={{ marginBottom: '20px' }}>Browse Insurance Policies</Title>
      <Paragraph>Explore different policy options and choose the one that best fits your needs.</Paragraph>
      <Row gutter={[24, 24]} justify="start">
        {samplePolicies.map((policy) => (
          <Col xs={24} sm={12} md={8} lg={6} key={policy.id}>
            <Card title={policy.name} bordered>
              <p>
                <strong>Premium:</strong> <DollarOutlined /> {policy.premium}
              </p>
              <p>
                <strong>Payout Amount:</strong> <DollarOutlined /> {policy.payoutAmount}
              </p>
              <p>
                <strong>Delay Threshold:</strong> <ClockCircleOutlined /> {policy.delayThreshold} min
              </p>
              <Button type="primary" block onClick={() => handlePurchase(policy.id)}>
                Purchase Policy
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default BrowsePolicies;
