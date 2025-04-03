import React, { useState } from "react";
import { Card, Alert, Button, Tag, Spin } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, DollarOutlined } from "@ant-design/icons";
import { FlightPolicyStatus, FlightUserPolicy } from "@/types/FlightPolicy";

interface ClaimStatusProps {
  claim: FlightUserPolicy;
}

const ClaimStatus: React.FC<ClaimStatusProps> = ({ claim }) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClaim = async () => {
    setIsProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Simulating claim processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccessMessage(`Successfully claimed ${claim.template.maxTotalPayout} ETH for flight ${claim.flightNumber}!`);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to process claim");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card title={`Flight ${claim.flightNumber}`} bordered>
      <p>
        <strong>Departure:</strong> {claim.departureTime}
      </p>
      <p>
        <strong>Premium Paid:</strong> <DollarOutlined /> {claim.template.premium}
      </p>
      <p>
        <strong>Payout Amount:</strong> <DollarOutlined /> {claim.template.maxTotalPayout}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <Tag color={claim.status === FlightPolicyStatus.Claimed ? "blue" : claim.status === FlightPolicyStatus.Active ? "gold" : "red"}>{claim.status}</Tag>
      </p>

      {claim.status === FlightPolicyStatus.Active ? (
        <Alert
          message="Eligible for Claim"
          description="Your flight was delayed beyond the threshold. You can submit a claim now."
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
        />
      ) : claim.status === FlightPolicyStatus.Claimed ? (
        <Alert message="Claim Processed" description="Your claim has already been processed and paid out." type="success" showIcon icon={<CheckCircleOutlined />} />
      ) : (
        <Alert
          message="Not Eligible for Claim"
          description="This policy is either expired or was not eligible for a claim."
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      )}

      {claim.status === FlightPolicyStatus.Active && (
        <Button type="primary" block onClick={handleClaim} loading={isProcessing} disabled={isProcessing} style={{ marginTop: "15px" }}>
          {isProcessing ? <Spin /> : "Claim Payout"}
        </Button>
      )}

      {successMessage && <Alert message={successMessage} type="success" showIcon style={{ marginTop: "15px" }} />}
      {errorMessage && <Alert message={errorMessage} type="error" showIcon style={{ marginTop: "15px" }} />}
    </Card>
  );
};

export default ClaimStatus;
