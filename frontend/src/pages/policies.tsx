import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Modal, Grid, Spin } from 'antd';
import { DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import PurchasePolicy from '../components/PurchasePolicy';
import { Policy, PolicyStatus } from '../services/flightInsurance';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Sample Policies Catalogue
const samplePolicies: Policy[] = [
  {
    policyId: 1,
    name: "Basic Flight Delay Cover",
    premium: "0.03 ETH",
    payoutAmount: "0.09 ETH",
    delayThreshold: 60,
    policyholder: "",
    flightNumber: "",
    departureTime: 0,
    isPaid: false,
    isClaimed: false,
    status: PolicyStatus.Active,
  },
  {
    policyId: 2,
    name: "Standard Flight Protection",
    premium: "0.05 ETH",
    payoutAmount: "0.15 ETH",
    delayThreshold: 90,
    policyholder: "",
    flightNumber: "",
    departureTime: 0,
    isPaid: false,
    isClaimed: false,
    status: PolicyStatus.Active,
  },
];

const BrowsePolicies: React.FC = () => {
  const screens = useBreakpoint();
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const handlePurchaseClick = (policy: Policy) => {
    setSelectedPolicy({ ...policy });
  };

  const handleCloseModal = () => {
    setSelectedPolicy(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Title level={2} style={{ marginBottom: '20px' }}>Browse Insurance Policies</Title>
      <Paragraph>Explore different policy options and choose the one that best fits your needs.</Paragraph>
      <Row gutter={[24, 24]} justify="start">
        {samplePolicies.map((policy) => (
          <Col xs={24} sm={12} md={8} lg={6} key={policy.policyId}>
            <Card title={policy.name} bordered>
              <p><strong>Premium:</strong> <DollarOutlined /> {policy.premium}</p>
              <p><strong>Payout Amount:</strong> <DollarOutlined /> {policy.payoutAmount}</p>
              <p><strong>Delay Threshold:</strong> <ClockCircleOutlined /> {policy.delayThreshold} min</p>
              <Button type="primary" block onClick={() => handlePurchaseClick(policy)}>
                Purchase Policy
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
      <Modal
        title="Purchase Policy"
        visible={!!selectedPolicy}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        {selectedPolicy ? (
          <PurchasePolicy selectedPolicy={selectedPolicy} onClose={handleCloseModal} />
        ) : (
          <Spin tip="Loading policy details..." />
        )}
      </Modal>
    </div>
  );
};

export default BrowsePolicies;
