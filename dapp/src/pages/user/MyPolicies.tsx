import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Alert,
  Modal,
  Select,
  message,
  Spin,
} from "antd";
import { WalletOutlined } from "@ant-design/icons";

import { useWeb3 } from "@/components/Web3Provider";
import { useFlightInsurance, FlightUserPolicy, FlightPolicyStatus } from "@/services/flightInsurance";

const { Title, Paragraph } = Typography;
const { Option } = Select;

const getStatusTag = (status: FlightPolicyStatus) => {
  switch (status) {
    case FlightPolicyStatus.Active:
      return <Tag color="green">Active</Tag>;
    case FlightPolicyStatus.Claimed:
      return <Tag color="blue">Claimed</Tag>;
    case FlightPolicyStatus.Expired:
      return <Tag color="orange">Expired</Tag>;
    default:
      return <Tag color="gray">Unknown</Tag>;
  }
};

const MyFlightPolicies = () => {
  const { account } = useWeb3();
  const { getUserFlightPolicies } = useFlightInsurance();

  const [policies, setPolicies] = useState<FlightUserPolicy[]>([]);
  const [filtered, setFiltered] = useState<FlightUserPolicy[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<FlightUserPolicy | null>(null);

  /**
   * Fetch policies for connected user
   */
  const fetchPolicies = async () => {
    if (!account) return;
    try {
      setLoading(true);
      console.log("Fetching user policies for:", account);
      const result = await getUserFlightPolicies(account);
      setPolicies(result);
      setFiltered(result);
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
  }, [account]);

  /**
   * Filter by status dropdown
   */
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    if (value === "all") {
      setFiltered(policies);
    } else {
      const statusNum = parseInt(value);
      setFiltered(policies.filter((p) => p.status === statusNum));
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
      ) : policies.length === 0 ? (
        <Alert
          message="No Policies Found"
          description="You have not purchased any flight policies yet."
          type="info"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-5">
            <Paragraph>
              Below are the flight insurance policies you've purchased.
            </Paragraph>
            <Select
              defaultValue="all"
              style={{ width: 200 }}
              onChange={handleStatusChange}
            >
              <Option value="all">All Statuses</Option>
              <Option value={FlightPolicyStatus.Active.toString()}>Active</Option>
              <Option value={FlightPolicyStatus.Claimed.toString()}>Claimed</Option>
              <Option value={FlightPolicyStatus.Expired.toString()}>Expired</Option>
            </Select>
          </div>

          <Row gutter={[24, 24]}>
            {filtered.map((policy) => (
              <Col xs={24} sm={12} md={8} lg={6} key={policy.policyId}>
                <Card
                  title={`Flight ${policy.flightNumber}`}
                  hoverable
                  onClick={() => setSelectedPolicy(policy)}
                  style={{
                    minHeight: "100%",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p><strong>Departure:</strong> {new Date(policy.departureTime * 1000).toLocaleString()}</p>
                    <p><strong>From:</strong> {policy.departureAirportCode}</p>
                    <p><strong>To:</strong> {policy.arrivalAirportCode}</p>
                    <p><strong>Premium:</strong> {policy.payoutToDate} ETH</p>
                    <p><strong>Status:</strong> {getStatusTag(policy.status)}</p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Optional Modal to show more details (can link to ViewPolicy component) */}
      <Modal
        title="Flight Policy Details"
        open={!!selectedPolicy}
        onCancel={() => setSelectedPolicy(null)}
        footer={null}
        destroyOnClose
      >
        {selectedPolicy ? (
          <div>
            <p><strong>Flight:</strong> {selectedPolicy.flightNumber}</p>
            <p><strong>From:</strong> {selectedPolicy.departureAirportCode}</p>
            <p><strong>To:</strong> {selectedPolicy.arrivalAirportCode}</p>
            <p><strong>Departure Time:</strong> {new Date(selectedPolicy.departureTime * 1000).toLocaleString()}</p>
            <p><strong>Purchased On:</strong> {new Date(selectedPolicy.createdAt * 1000).toLocaleString()}</p>
            <p><strong>Premium Paid:</strong> {selectedPolicy.payoutToDate} ETH</p>
            <p><strong>Status:</strong> {getStatusTag(selectedPolicy.status)}</p>
          </div>
        ) : (
          <Spin />
        )}
      </Modal>
    </div>
  );
};

export default MyFlightPolicies;
