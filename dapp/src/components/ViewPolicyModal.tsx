import { Card, Modal, Spin, Tag, Button } from "antd";
import { FlightPolicyStatus, FlightUserPolicy } from "../types/FlightPolicy";
import { BaggagePolicyStatus, BaggageUserPolicy } from "../types/BaggagePolicy";

type ViewPolicyModalProps = {
  type: "flight" | "baggage";
  policy: FlightUserPolicy | BaggageUserPolicy | undefined;
  onCancel: () => void;
  onClaim: () => void;
};

const ViewPolicyModal = ({ type, policy, onCancel , onClaim }: ViewPolicyModalProps) => {
  const getStatusTag = (status: FlightPolicyStatus | BaggagePolicyStatus) => {
    switch (status) {
      case FlightPolicyStatus.Active | BaggagePolicyStatus.Active:
        return <Tag color="green">Active</Tag>;
      case FlightPolicyStatus.Claimed | BaggagePolicyStatus.Claimed:
        return <Tag color="blue">Claimed</Tag>;
      case FlightPolicyStatus.Expired | BaggagePolicyStatus.Expired:
        return <Tag color="orange">Expired</Tag>;
      default:
        return <Tag color="gray">Unknown</Tag>;
    }
  };

  // Render flight policy details
  const renderFlightPolicyDetails = (policy: FlightUserPolicy) => (
    <>
      <p><strong>Policy ID:</strong> {policy.policyId}</p>
      <p><strong>Flight Number:</strong> {policy.flightNumber}</p>
      <p><strong>From:</strong> {policy.departureAirportCode}</p>
      <p><strong>To:</strong> {policy.arrivalAirportCode}</p>
      <p><strong>Departure Time:</strong> {new Date(policy.departureTime * 1000).toLocaleString()}</p>
      <p><strong>Date of Purchase:</strong> {new Date(policy.createdAt * 1000).toLocaleString()}</p>
      <p><strong>Payout To Date:</strong> {policy.payoutToDate} ETH</p>
      <p><strong>Buyer:</strong> {policy.buyer}</p>

      <p><strong>Policy Description:</strong> {policy.template.description}</p>
      <p><strong>Policy Premium:</strong> {policy.template.premium} ETH</p>
      <p><strong>Policy Payout Per Hour:</strong> {policy.template.payoutPerHour} ETH/hr</p>
      <p><strong>Policy Delay Threshold:</strong> {policy.template.delayThresholdHours} hours</p>
      <p><strong>Policy Max Total Payout:</strong> {policy.template.maxTotalPayout} ETH</p>
      <p><strong>Policy Coverage Duration:</strong> {policy.template.coverageDurationDays} hours</p>
      <p><strong>Status:</strong> {getStatusTag(policy.status)}</p>
    </>
  );

  // Render baggage policy details
  const renderBaggagePolicyDetails = (policy: BaggageUserPolicy) => (
    <>
      <p><strong>Policy ID:</strong> {policy.policyId}</p>
      <p><strong>Item Description:</strong> {policy.itemDescription}</p>
      <p><strong>Date of Purchase:</strong> {new Date(policy.createdAt * 1000).toLocaleString()}</p>
      <p><strong>Payout To Date:</strong> {policy.payoutToDate} ETH</p>
      <p><strong>Buyer:</strong> {policy.buyer}</p>

      <p><strong>Policy Description:</strong> {policy.template.description}</p>
      <p><strong>Policy Premium:</strong> {policy.template.premium} ETH</p>
      <p><strong>Policy Payout If Delayed:</strong> {policy.template.payoutIfDelayed} ETH</p>
      <p><strong>Policy Payout If Lost:</strong> {policy.template.payoutIfLost} ETH</p>
      <p><strong>Policy Max Total Payout:</strong> {policy.template.maxTotalPayout} ETH</p>
      <p><strong>Policy Coverage Duration:</strong> {policy.template.coverageDurationDays} days</p>
      <p><strong>Status:</strong> {getStatusTag(policy.status)}</p>
    </>
  );

  const isClaimable = policy?.status === FlightPolicyStatus.Active || policy?.status === BaggagePolicyStatus.Active;

  return (
    <Modal title={`${policy?.template.name}`} open={!!policy} onCancel={onCancel} footer={null} destroyOnClose>
      <Card>
        {policy ? (
          type === "flight" ? renderFlightPolicyDetails(policy as FlightUserPolicy) : renderBaggagePolicyDetails(policy as BaggageUserPolicy)
        ) : (
          <Spin />
        )}
      </Card>

      {isClaimable && (
        <div style={{ textAlign: "center" }}>
          <Button
            type="primary"
            onClick={onClaim}
            style={{ marginTop: 16 }}
          >
            Claim Policy
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default ViewPolicyModal;
