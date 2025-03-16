import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Alert, Grid } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { useWeb3 } from '../components/Web3Provider';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Sample Policies
const samplePolicies = [
  {
    policyId: 1,
    flightNumber: "SQ318",
    departureTime: "2025-03-20 08:30 AM",
    premium: "0.05 ETH",
    payoutAmount: "0.15 ETH",
    status: "Active",
  },
  {
    policyId: 2,
    flightNumber: "BA216",
    departureTime: "2025-03-18 02:15 PM",
    premium: "0.07 ETH",
    payoutAmount: "0.21 ETH",
    status: "Claimed",
  },
  {
    policyId: 3,
    flightNumber: "CX888",
    departureTime: "2025-03-22 10:00 PM",
    premium: "0.06 ETH",
    payoutAmount: "0.18 ETH",
    status: "Cancelled",
  },
];

const getStatusTag = (status: string) => {
  switch (status) {
    case "Active":
      return <Tag color="green">Active</Tag>;
    case "Claimed":
      return <Tag color="blue">Claimed</Tag>;
    case "Cancelled":
      return <Tag color="red">Cancelled</Tag>;
    default:
      return <Tag color="gray">Unknown</Tag>;
  }
};

const MyPolicies: React.FC = () => {
  const { account } = useWeb3();
  const [policies] = useState(samplePolicies);
  const screens = useBreakpoint();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Title level={2} style={{ marginBottom: '20px' }}>My Policies</Title>
      
      {!account ? (
        <Alert
          message="Wallet Not Connected"
          description="Please connect your wallet to view your policies."
          type="warning"
          showIcon
          icon={<WalletOutlined />}
          style={{ marginBottom: '20px' }}
        />
      ) : policies.length === 0 ? (
        <Alert
          message="No Policies Found"
          description="You have not signed up for any flight delay insurance policies yet."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      ) : (
        <>
          <Paragraph>Here are the flight delay insurance policies you have signed up for.</Paragraph>
          <Row gutter={[24, 24]} justify="start">
            {policies.map((policy) => (
              <Col xs={24} sm={12} md={8} lg={6} key={policy.policyId}>
                <Card title={`Flight ${policy.flightNumber}`} bordered style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flexGrow: 1 }}>
                    <p><strong>Departure Time:</strong> {policy.departureTime}</p>
                    <p><strong>Premium Paid:</strong> {policy.premium}</p>
                    <p><strong>Payout Amount:</strong> {policy.payoutAmount}</p>
                    <p><strong>Status:</strong> {getStatusTag(policy.status)}</p>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    {policy.status === "Active" && (
                      <Button type="primary" icon={<CheckCircleOutlined />}>Claim Payout</Button>
                    )}
                    {policy.status === "Cancelled" && (
                      <Button type="default" icon={<CloseCircleOutlined />} disabled>Cancelled</Button>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
};

export default MyPolicies;
