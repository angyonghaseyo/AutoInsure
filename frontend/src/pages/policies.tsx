import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Button, Modal, Grid, Spin, Alert } from "antd";
import { DollarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import PurchasePolicy from "../components/PurchasePolicy";
import { useFlightInsurance, Policy } from "../services/flightInsurance";

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const BrowsePolicies = () => {
  const screens = useBreakpoint();
  const { getAvailablePolicies } = useFlightInsurance(); // Fetch policies from blockchain
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  /**
   * Fetch policies from the blockchain when the component mounts.
   */
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const fetchedPolicies = await getAvailablePolicies();
        setPolicies(fetchedPolicies);
      } catch (err) {
        console.error("Error fetching policies:", err);
        setError("Failed to load policies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const handlePurchaseClick = (policy: Policy) => {
    setSelectedPolicy({ ...policy });
  };

  const handleCloseModal = () => {
    setSelectedPolicy(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Title level={2} style={{ marginBottom: "20px" }}>Browse Insurance Policies</Title>
      <Paragraph>Explore different policy options and choose the one that best fits your needs.</Paragraph>

      {/* Show loading spinner while fetching policies */}
      {loading ? (
        <div className="flex justify-center my-10">
          <Spin size="large" tip="Loading policies..." />
        </div>
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : policies.length === 0 ? (
        <Alert message="No policies available" description="There are currently no active insurance policies available." type="info" showIcon />
      ) : (
        <Row gutter={[24, 24]} justify="start">
          {policies.map((policy) => (
            <Col xs={24} sm={12} md={8} lg={6} key={policy.policyId}>
              <Card title={policy.name} bordered>
                <p><strong>Premium:</strong> <DollarOutlined /> {policy.premium} ETH</p>
                <p><strong>Payout Amount:</strong> <DollarOutlined /> {policy.payoutAmount} ETH</p>
                <p><strong>Delay Threshold:</strong> <ClockCircleOutlined /> {policy.delayThreshold} min</p>
                <Button type="primary" block onClick={() => handlePurchaseClick(policy)}>
                  Purchase Policy
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

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
