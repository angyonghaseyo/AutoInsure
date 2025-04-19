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
  onClaimSuccess: () => void;
};

const ViewPolicyModal = ({ type, policy, onCancel, onClaimSuccess }: ViewPolicyModalProps) => {
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
        throw new Error("Baggage claims not implemented yet.");
      }
      message.success("Payout successfully claimed!");
      onClaimSuccess();
    } catch (err: any) {
      message.error(err.message || "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  const renderFlightPolicyDetails = (policy: FlightUserPolicy) => (
    <>
      <p><strong>Policy ID:</strong> {policy.policyId}</p>
      <p><strong>Flight Number:</strong> {policy.flightNumber}</p>
      <p><strong>Departure Time:</strong> {new Date(policy.departureTime * 1000).toLocaleString()}</p>
      <p><strong>Date of Purchase:</strong> {new Date(policy.createdAt * 1000).toLocaleString()}</p>
      <p><strong>Payout To Date:</strong> {policy.payoutToDate} ETH</p>
      <p><strong>Buyer:</strong> {policy.buyer}</p>
      <p><strong>Policy Description:</strong> {policy.template.description}</p>
      <p><strong>Premium:</strong> {policy.template.premium} ETH</p>
      <p><strong>Payout Per Hour:</strong> {policy.template.payoutPerHour} ETH/hr</p>
      <p><strong>Delay Threshold:</strong> {policy.template.delayThresholdHours} hours</p>
      <p><strong>Max Total Payout:</strong> {policy.template.maxTotalPayout} ETH</p>
      <p><strong>Coverage Duration:</strong> {convertSecondsToDays(policy.template.coverageDurationSeconds).toPrecision(1)} days</p>
      <p><strong>Status:</strong> {getStatusTag(policy.status)}</p>
    </>
  );

  const renderBaggagePolicyDetails = (policy: BaggageUserPolicy) => (
    <>
      <p><strong>Policy ID:</strong> {policy.policyId}</p>
      <p><strong>Flight Number:</strong> {policy.flightNumber}</p>
      <p><strong>Departure Time:</strong> {new Date(policy.departureTime * 1000).toLocaleString()}</p>
      <p><strong>Item Description:</strong> {policy.itemDescription}</p>
      <p><strong>Date of Purchase:</strong> {new Date(policy.createdAt * 1000).toLocaleString()}</p>
      <p><strong>Payout To Date:</strong> {policy.payoutToDate} ETH</p>
      <p><strong>Buyer:</strong> {policy.buyer}</p>
      <p><strong>Policy Description:</strong> {policy.template.description}</p>
      <p><strong>Premium:</strong> {policy.template.premium} ETH</p>
      <p><strong>Max Total Payout:</strong> {policy.template.maxTotalPayout} ETH</p>
      <p><strong>Coverage Duration:</strong> {convertSecondsToDays(policy.template.coverageDurationSeconds).toPrecision(1)} days</p>
      <p><strong>Status:</strong> {getStatusTag(policy.status)}</p>
    </>
  );

  const isClaimable = policy?.status === FlightPolicyStatus.Active || policy?.status === BaggagePolicyStatus.Active;

  return (
    <Modal
      title={`${policy?.template.name}`}
      open={!!policy}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Card>
        {type === "flight"
          ? renderFlightPolicyDetails(policy as FlightUserPolicy)
          : renderBaggagePolicyDetails(policy as BaggageUserPolicy)}
      </Card>

      {isClaimable && type === "flight" && (
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
