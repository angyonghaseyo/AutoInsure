import { useEffect, useState } from "react";
import { Row, Col, Typography, Modal, Spin, Alert } from "antd";
import { useFlightInsurance } from "@/services/flightInsurance";
import { useBaggageInsurance } from "@/services/baggageInsurance";
import { FlightPolicyTemplate } from "@/types/FlightPolicy";
import { BaggagePolicyTemplate } from "@/types/BaggagePolicy";
import PurchasePolicy from "@/components/PurchasePolicy";
import UserPolicyTemplateCard from "@/components/UserPolicyTemplateCard";

const { Title, Paragraph } = Typography;

const BrowseFlightPolicyTemplates = () => {
  const [flightTemplates, setFlightTemplates] = useState<FlightPolicyTemplate[]>([]);
  const [baggageTemplates, setBaggageTemplates] = useState<BaggagePolicyTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FlightPolicyTemplate | BaggagePolicyTemplate | null>(null);
  const [type, setType] = useState<"flight" | "baggage">("flight");

  const { getActiveFlightPolicyTemplates, isFlightPolicyTemplateAllowedForPurchase } = useFlightInsurance();
  const { getActiveBaggagePolicyTemplates, isBaggagePolicyTemplateAllowedForPurchase } = useBaggageInsurance();

  /**
   * Fetch active policy templates for flight and baggage, and filter by purchase eligibility.
   */
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const [flightTemplatesData, baggageTemplatesData] = await Promise.all([
        getActiveFlightPolicyTemplates(),
        getActiveBaggagePolicyTemplates()
      ]);

      // Filter flight and baggage templates by eligibility
      const flightIsAllowed = await isFlightPolicyTemplateAllowedForPurchase(flightTemplatesData);
      const allowedFlightTemplates = flightTemplatesData.filter((tpl, index) => flightIsAllowed[index]);

      const baggageIsAllowed = await isBaggagePolicyTemplateAllowedForPurchase(baggageTemplatesData);
      const allowedBaggageTemplates = baggageTemplatesData.filter((tpl, index) => baggageIsAllowed[index]);

      setFlightTemplates(allowedFlightTemplates);
      setBaggageTemplates(allowedBaggageTemplates);

    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Unable to load policy templates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Title level={2}>Policy Templates</Title>
      <Paragraph>Select an insurance policy that fits your travel needs. All templates shown below are active and available for purchase.</Paragraph>

      {/* Loading or error display */}
      {loading ? (
        <div className="flex justify-center my-10">
          <Spin size="large" tip="Loading policy templates..." />
        </div>
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : flightTemplates.length + baggageTemplates.length === 0 ? (
        <Alert message="No Policies Available" description="Currently there are no active flight or baggage policy templates available for purchase." type="info" showIcon />
      ) : (
        <>
          {/* Flight Templates */}
          {flightTemplates.length > 0 && <Title level={3}>Flight Templates</Title>}
          <Row gutter={[24, 24]}>
            {flightTemplates.map((tpl) => (
              <Col xs={24} sm={12} md={8} lg={6} key={tpl.templateId}>
                <UserPolicyTemplateCard
                  template={tpl}
                  type="flight"
                  onPurchase={() => {
                    setSelectedTemplate(tpl);
                    setType("flight");
                  }}
                />
              </Col>
            ))}
          </Row>

          {/* Baggage Templates */}
          {baggageTemplates.length > 0 && <Title level={3}>Baggage Templates</Title>}
          <Row gutter={[24, 24]}>
            {baggageTemplates.map((tpl) => (
              <Col xs={24} sm={12} md={8} lg={6} key={tpl.templateId}>
                <UserPolicyTemplateCard
                  template={tpl}
                  type="baggage"
                  onPurchase={() => {
                    setSelectedTemplate(tpl);
                    setType("baggage");
                  }}
                />
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Purchase Modal */}
      <Modal open={!!selectedTemplate} onCancel={handleCloseModal} footer={null} destroyOnClose>
        {selectedTemplate ? <PurchasePolicy type={type} selectedTemplate={selectedTemplate} onClose={handleCloseModal} /> : <Spin tip="Loading..." />}
      </Modal>
    </div>
  );
};

export default BrowseFlightPolicyTemplates;
