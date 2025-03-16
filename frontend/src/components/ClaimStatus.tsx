import React, { useState } from 'react';
import { Card, Alert, Button, Tag, Spin } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { Policy, PolicyStatus, formatDepartureTime } from '../services/flightInsurance';

interface ClaimStatusProps {
  claim: Policy;
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

      setSuccessMessage(`Successfully claimed ${claim.payoutAmount} ETH for flight ${claim.flightNumber}!`);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to process claim');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card title={`Flight ${claim.flightNumber}`} bordered>
      <p>
        <strong>Departure:</strong> {formatDepartureTime(claim.departureTime)}
      </p>
      <p>
        <strong>Premium Paid:</strong> <DollarOutlined /> {claim.premium}
      </p>
      <p>
        <strong>Payout Amount:</strong> <DollarOutlined /> {claim.payoutAmount}
      </p>
      <p>
        <strong>Status:</strong>{' '}
        <Tag color={claim.status === PolicyStatus.Claimed ? 'blue' : claim.status === PolicyStatus.Active ? 'gold' : 'red'}>
          {claim.status}
        </Tag>
      </p>

      {claim.status === PolicyStatus.Active ? (
        <Alert
          message="Eligible for Claim"
          description="Your flight was delayed beyond the threshold. You can submit a claim now."
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
        />
      ) : claim.status === PolicyStatus.Claimed ? (
        <Alert
          message="Claim Processed"
          description="Your claim has already been processed and paid out."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      ) : (
        <Alert
          message="Not Eligible for Claim"
          description="This policy is either expired or was not eligible for a claim."
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      )}

      {claim.status === PolicyStatus.Active && (
        <Button
          type="primary"
          block
          onClick={handleClaim}
          loading={isProcessing}
          disabled={isProcessing}
          style={{ marginTop: '15px' }}
        >
          {isProcessing ? <Spin /> : 'Claim Payout'}
        </Button>
      )}

      {successMessage && (
        <Alert message={successMessage} type="success" showIcon style={{ marginTop: '15px' }} />
      )}
      {errorMessage && (
        <Alert message={errorMessage} type="error" showIcon style={{ marginTop: '15px' }} />
      )}
    </Card>
  );
};

export default ClaimStatus;
