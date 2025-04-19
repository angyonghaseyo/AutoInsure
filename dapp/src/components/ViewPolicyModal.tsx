import { useState } from "react";
import { Modal, Card, Tag, Button, message, Spin } from "antd";
import { FlightPolicyStatus, FlightUserPolicy } from "../types/FlightPolicy";
import { BaggagePolicyStatus, BaggageUserPolicy } from "../types/BaggagePolicy";
import { useFlightInsurance } from "@/services/flightInsurance";
import { convertSecondsToDays, getStatusTag } from "@/utils/utils";

type ViewPolicyModalProps = {
  type: "flight" | "baggage";
  policy: FlightUserPolicy | BaggageUserPolicy | undefined;
  onCancel: () => void;
};

const ViewPolicyModal = ({ type, policy, onCancel }: ViewPolicyModalProps) => {
  const { claimFlightPayout } = useFlightInsurance();
  const [loading, setLoading] = useState(false);

  if (!policy) return null;

  const handleClaim = async () => {
    setLoading(true);
    try {
      if (type === "flight") {
        const p = policy as FlightUserPolicy;
        await claimFlightPayout(p.policyId);
      } else {
        // you can wire up baggage claims similarly
        throw new Error("Baggage claims not implemented");
      }
      message.success("Payout successfully claimed!");
      onCancel();
    } catch (err: any) {
      message.error(err.message || "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  // Render flight policy details
  const renderFlightPolicyDetails = (policy: FlightUserPolicy) => (
    <>
      <p>
        <strong>Policy ID:</strong> {policy.policyId}
      </p>
      <p>
        <strong>Flight Number:</strong> {policy.flightNumber}
      </p>
      <p>
        <strong>From:</strong> {policy.departureAirportCode}
      </p>
      <p>
        <strong>To:</strong> {policy.arrivalAirportCode}
      </p>
      <p>
        <strong>Departure Time:</strong> {new Date(policy.departureTime * 1000).toLocaleString()}
      </p>
      <p>
        <strong>Date of Purchase:</strong> {new Date(policy.createdAt * 1000).toLocaleString()}
      </p>
      <p>
        <strong>Payout To Date:</strong> {policy.payoutToDate} ETH
      </p>
      <p>
        <strong>Buyer:</strong> {policy.buyer}
      </p>

      <p>
        <strong>Policy Description:</strong> {policy.template.description}
      </p>
      <p>
        <strong>Policy Premium:</strong> {policy.template.premium} ETH
      </p>
      <p>
        <strong>Policy Payout Per Hour:</strong> {policy.template.payoutPerHour} ETH/hr
      </p>
      <p>
        <strong>Policy Delay Threshold:</strong> {policy.template.delayThresholdHours} hours
      </p>
      <p>
        <strong>Policy Max Total Payout:</strong> {policy.template.maxTotalPayout} ETH
      </p>
      <p>
        <strong>Policy Coverage Duration:</strong> {convertSecondsToDays(policy.template.coverageDurationSeconds).toPrecision(1)} days
      </p>
      <p>
        <strong>Status:</strong> {getStatusTag(policy.status)}
      </p>
    </>
  );

  // Render baggage policy details
  const renderBaggagePolicyDetails = (policy: BaggageUserPolicy) => (
    <>
      <p>
        <strong>Policy ID:</strong> {policy.policyId}
      </p>
      <p>
        <strong>Item Description:</strong> {policy.itemDescription}
      </p>
      <p>
        <strong>Date of Purchase:</strong> {new Date(policy.createdAt * 1000).toLocaleString()}
      </p>
      <p>
        <strong>Payout To Date:</strong> {policy.payoutToDate} ETH
      </p>
      <p>
        <strong>Buyer:</strong> {policy.buyer}
      </p>

      <p>
        <strong>Policy Description:</strong> {policy.template.description}
      </p>
      <p>
        <strong>Policy Premium:</strong> {policy.template.premium} ETH
      </p>
      <p>
        <strong>Policy Payout If Delayed:</strong> {policy.template.payoutIfDelayed} ETH
      </p>
      <p>
        <strong>Policy Payout If Lost:</strong> {policy.template.payoutIfLost} ETH
      </p>
      <p>
        <strong>Policy Max Total Payout:</strong> {policy.template.maxTotalPayout} ETH
      </p>
      <p>
        <strong>Policy Coverage Duration:</strong> {convertSecondsToDays(policy.template.coverageDurationSeconds).toPrecision(1)} days
      </p>
      <p>
        <strong>Status:</strong> {getStatusTag(policy.status)}
      </p>
    </>
  );

  const isClaimable = policy?.status === FlightPolicyStatus.Active || policy?.status === BaggagePolicyStatus.Active;

  return (
    <Modal title={`${policy?.template.name}`} open={!!policy} onCancel={onCancel} footer={null} destroyOnClose>
      <Card>{policy ? type === "flight" ? renderFlightPolicyDetails(policy as FlightUserPolicy) : renderBaggagePolicyDetails(policy as BaggageUserPolicy) : <Spin />}</Card>

      {isClaimable && (
        <div style={{ textAlign: "center" }}>
          <Button type="primary" onClick={handleClaim} loading={loading} style={{ marginTop: 16 }}>
            {loading ? "Processing…" : "Claim Policy"}
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default ViewPolicyModal;
