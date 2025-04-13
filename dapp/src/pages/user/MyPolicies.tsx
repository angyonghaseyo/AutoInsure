import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Alert, Modal, Select, message, Spin } from "antd";
import { WalletOutlined } from "@ant-design/icons";

import { useWeb3 } from "@/components/Web3Provider";
import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyStatus, FlightUserPolicy } from "@/types/FlightPolicy";
import { useBaggageInsurance } from "@/services/baggageInsurance";
import { BaggageUserPolicy } from "@/types/BaggagePolicy";
import { getStatusTag } from "@/utils/utils";
import { ViewPolicyModal } from "@/components/ViewPolicyModal";

const { Title, Paragraph } = Typography;
const { Option } = Select;

const MyFlightPolicies = () => {
  const { insurerContract, account } = useWeb3();
  const { getUserFlightPolicies } = useFlightInsurance();
  const { getUserBaggagePolicies } = useBaggageInsurance();

  const [flightPolicies, setFlightPolicies] = useState<FlightUserPolicy[]>([]);
  const [baggagePolicies, setBaggagePolicies] = useState<BaggageUserPolicy[]>([]);
  const [flightFiltered, setFlightFiltered] = useState<FlightUserPolicy[]>([]);
  const [baggageFiltered, setBaggageFiltered] = useState<BaggageUserPolicy[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<FlightUserPolicy | BaggageUserPolicy>();
  const [type, setType] = useState<"flight" | "baggage">("flight");

  /**
   * Fetch policies for connected user
   */
  const fetchPolicies = async () => {
    if (!account) return;
    try {
      setLoading(true);
      const flightPolicies = await getUserFlightPolicies(account);
      setFlightPolicies(flightPolicies);
      setFlightFiltered(flightPolicies);

      const baggagePolicies = await getUserBaggagePolicies(account);
      setBaggagePolicies(baggagePolicies);
      setBaggageFiltered(baggagePolicies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      message.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchPolicies();
    }
  }, [account, insurerContract]);

  /**
   * Filter by status dropdown
   */
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    if (value === "all") {
      setFlightFiltered(flightPolicies);
      setBaggageFiltered(baggagePolicies);
    } else if (value === "flight") {
      setFlightFiltered(flightPolicies);
      setBaggageFiltered([]);
    } else if (value === "baggage") {
      setFlightFiltered([]);
      setBaggageFiltered(baggagePolicies);
    } else {
      const statusNum = parseInt(value);
      setFlightFiltered(flightPolicies.filter((p) => p.status === statusNum));
      setBaggageFiltered(baggagePolicies.filter((p) => p.status === statusNum));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Title level={2}>My Flight Policies</Title>

      {!account ? (
        <Alert
          message="Wallet Not Connected"
          description="Please connect your wallet to view your policies."
          type="warning"
          icon={<WalletOutlined />}
          showIcon
          style={{ marginBottom: "20px" }}
        />
      ) : loading ? (
        <div className="text-center mt-10">
          <Spin size="large" />
        </div>
      ) : flightPolicies.length + baggagePolicies.length === 0 ? (
        <Alert message="No Policies Found" description="You have not purchased any flight policies yet." type="info" showIcon style={{ marginBottom: "20px" }} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-5">
            <Paragraph>Below are the flight insurance policies you've purchased.</Paragraph>
            <Select defaultValue="all" style={{ width: 200 }} onChange={handleStatusChange}>
              <Option value="all">All Statuses</Option>
              <Option value="flight">Flights</Option>
              <Option value="baggage">Baggage</Option>
              <Option value={FlightPolicyStatus.Active.toString()}>Active</Option>
              <Option value={FlightPolicyStatus.Claimed.toString()}>Claimed</Option>
              <Option value={FlightPolicyStatus.Expired.toString()}>Expired</Option>
            </Select>
          </div>

          {/* Flight Policies */}
          {flightFiltered.length > 0 && <Title level={3}>Flight Policies</Title>}
          <Row gutter={[24, 24]}>
            {flightFiltered.map((policy) => (
              <Col xs={24} sm={12} md={8} lg={6} key={policy.policyId}>
                <Card
                  title={`${policy.template.name}`}
                  hoverable
                  onClick={() => {
                    setSelectedPolicy(policy);
                    setType("flight");
                  }}
                  style={{
                    minHeight: "100%",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p>
                      <strong>Flight:</strong> {policy.flightNumber}
                    </p>
                    <p>
                      <strong>Departure:</strong> {new Date(policy.departureTime * 1000).toLocaleString()}
                    </p>
                    <p>
                      <strong>From:</strong> {policy.departureAirportCode}
                    </p>
                    <p>
                      <strong>To:</strong> {policy.arrivalAirportCode}
                    </p>
                    <p>
                      <strong>Premium:</strong> {policy.template.premium} ETH
                    </p>
                    <p>
                      <strong>Status:</strong> {getStatusTag(policy.status)}
                    </p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Baggage Policies */}
          {baggageFiltered.length > 0 && <Title level={3}>Baggage Policies</Title>}
          <Row gutter={[24, 24]}>
            {baggageFiltered.map((policy) => (
              <Col xs={24} sm={12} md={8} lg={6} key={policy.policyId}>
                <Card
                  title={`${policy.template.name}`}
                  hoverable
                  onClick={() => {
                    setSelectedPolicy(policy);
                    setType("baggage");
                  }}
                  style={{
                    minHeight: "100%",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p>
                      <strong>Item Description:</strong> {policy.itemDescription}
                    </p>
                    <p>
                      <strong>Status:</strong> {getStatusTag(policy.status)}
                    </p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* View Policy Modal */}
      <ViewPolicyModal type={type} policy={selectedPolicy} onCancel={() => setSelectedPolicy(undefined)} />
    </div>
  );
};

export default MyFlightPolicies;
