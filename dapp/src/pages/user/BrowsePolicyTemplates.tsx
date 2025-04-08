import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Button, Modal, Spin, Alert } from "antd";
import { DollarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import PurchasePolicy from "@/components/PurchasePolicy";
import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyTemplate } from "@/types/FlightPolicy";

const { Title, Paragraph } = Typography;

const BrowseFlightPolicyTemplates = () => {
  const { getActiveFlightPolicyTemplates } = useFlightInsurance();

  const [templates, setTemplates] = useState<FlightPolicyTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FlightPolicyTemplate | null>(null);

  /**
   * Fetch all active flight policy templates on mount.
   */
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getActiveFlightPolicyTemplates();
        setTemplates(result);
      } catch (err) {
        console.error("Error fetching active templates:", err);
        setError("Unable to load policy templates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSelectTemplate = (tpl: FlightPolicyTemplate) => {
    setSelectedTemplate(tpl);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Title level={2}>Flight Policy Templates</Title>
      <Paragraph>Select a flight insurance policy that fits your travel needs. All templates shown below are active and available for purchase.</Paragraph>

      {/* Loading or error display */}
      {loading ? (
        <div className="flex justify-center my-10">
          <Spin size="large" tip="Loading policy templates..." />
        </div>
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : templates.length === 0 ? (
        <Alert message="No Policies Available" description="Currently there are no active flight policy templates available for purchase." type="info" showIcon />
      ) : (
        <Row gutter={[24, 24]}>
          {templates.map((tpl) => (
            <Col xs={24} sm={12} md={8} lg={6} key={tpl.templateId}>
              <Card
                title={tpl.name}
                style={{
                  minHeight: 340,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p>{tpl.description}</p>
                  <p>
                    <strong>Premium:</strong> <DollarOutlined /> {tpl.premium} ETH
                  </p>
                  <p>
                    <strong>Payout/Hour:</strong> <DollarOutlined /> {tpl.payoutPerHour} ETH
                  </p>
                  <p>
                    <strong>Max Payout:</strong> {tpl.maxTotalPayout} ETH
                  </p>
                  <p>
                    <strong>Delay Threshold:</strong> <ClockCircleOutlined /> {tpl.delayThresholdHours} hrs
                  </p>
                  <p>
                    <strong>Coverage Duration:</strong> {tpl.coverageDurationDays} days
                  </p>
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Button type="primary" block onClick={() => handleSelectTemplate(tpl)}>
                    Purchase Policy
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Purchase Modal */}
      <Modal title="Purchase Policy" open={!!selectedTemplate} onCancel={handleCloseModal} footer={null} destroyOnClose>
        {selectedTemplate ? <PurchasePolicy selectedTemplate={selectedTemplate} onClose={handleCloseModal} /> : <Spin tip="Loading..." />}
      </Modal>
    </div>
  );
};

export default BrowseFlightPolicyTemplates;
