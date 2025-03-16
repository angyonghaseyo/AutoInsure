import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Alert, Grid, Modal } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { useWeb3 } from '../components/Web3Provider';
import ViewPolicy from '../components/ViewPolicy';
import { Policy } from '../services/flightInsurance';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Enum for Policy Status
enum PolicyStatus {
  Active = "Active",
  Expired = "Expired",
  Claimed = "Claimed",
  Cancelled = "Cancelled"
}

// Sample Policies
const samplePolicies: Policy[] = [
  {
    policyId: 1,
    policyholder: "0x123...abc",
    flightNumber: "SQ318",
    departureTime: 1745303400,
    premium: "0.05 ETH",
    payoutAmount: "0.15 ETH",
    status: PolicyStatus.Active,
    isPaid: false,
    isClaimed: false,
    delayThreshold: 120,
  },
  {
    policyId: 2,
    policyholder: "0x456...def",
    flightNumber: "BA216",
    departureTime: 1745127300,
    premium: "0.07 ETH",
    payoutAmount: "0.21 ETH",
    status: PolicyStatus.Claimed,
    isPaid: true,
    isClaimed: true,
    delayThreshold: 180,
  },
  {
    policyId: 3,
    policyholder: "0x789...ghi",
    flightNumber: "CX888",
    departureTime: 1745526000,
    premium: "0.06 ETH",
    payoutAmount: "0.18 ETH",
    status: PolicyStatus.Cancelled,
    isPaid: true,
    isClaimed: false,
    delayThreshold: 150,
  },
];

const getStatusTag = (status: PolicyStatus) => {
  switch (status) {
    case PolicyStatus.Active:
      return <Tag color="green">Active</Tag>;
    case PolicyStatus.Claimed:
      return <Tag color="blue">Claimed</Tag>;
    case PolicyStatus.Cancelled:
      return <Tag color="red">Cancelled</Tag>;
    case PolicyStatus.Expired:
      return <Tag color="gray">Expired</Tag>;
    default:
      return <Tag color="gray">Unknown</Tag>;
  }
};

const MyPolicies: React.FC = () => {
  const { account } = useWeb3();
  const [policies] = useState(samplePolicies);
  const screens = useBreakpoint();
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  
  const handleCardClick = (policy: Policy) => {
    setSelectedPolicy(policy);
  };

  const handleCloseModal = () => {
    setSelectedPolicy(null);
  };

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
                <Card
                  title={`Flight ${policy.flightNumber}`}
                  bordered
                  hoverable
                  onClick={() => handleCardClick(policy)}
                  style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                >
                  <div style={{ flexGrow: 1 }}>
                    <p><strong>Departure Time:</strong> {new Date(policy.departureTime * 1000).toLocaleString()}</p>
                    <p><strong>Premium Paid:</strong> {policy.premium}</p>
                    <p><strong>Payout Amount:</strong> {policy.payoutAmount}</p>
                    <p><strong>Status:</strong> {getStatusTag(policy.status)}</p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
      
      <Modal
        title="Policy Details"
        visible={!!selectedPolicy}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        {selectedPolicy && <ViewPolicy policy={selectedPolicy} onClaim={() => {}} onCancel={() => {}} isProcessing={false} />}
      </Modal>
    </div>
  );
};

export default MyPolicies;
