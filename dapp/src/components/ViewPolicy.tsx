import React from 'react';
import { Descriptions, Card, Button, Alert, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, DollarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Policy, formatDepartureTime, isEligibleForClaim, isEligibleForCancellation } from '../services/flightInsurance';

interface ViewPolicyProps {
  policy: Policy;
  onClaim: (policyId: number) => void;
  onCancel: (policyId: number) => void;
  isProcessing: boolean;
}

const ViewPolicy: React.FC<ViewPolicyProps> = ({ policy, onClaim, onCancel, isProcessing }) => {
  return (
    <Card title={`Flight ${policy.flightNumber}`} bordered>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Status">
          <Tag color={policy.status === "Active" ? "green" : policy.status === "Expired" ? "gray" : policy.status === "Claimed" ? "blue" : "red"}>
            {policy.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Departure Time">
          <CalendarOutlined /> {formatDepartureTime(policy.departureTime)}
        </Descriptions.Item>
        <Descriptions.Item label="Policy ID">{policy.policyId}</Descriptions.Item>
        <Descriptions.Item label="Policyholder">{policy.policyholder}</Descriptions.Item>
        <Descriptions.Item label="Premium">
          <DollarOutlined /> {policy.premium}
        </Descriptions.Item>
        <Descriptions.Item label="Payout Amount">
          <DollarOutlined /> {policy.payoutAmount}
        </Descriptions.Item>
        <Descriptions.Item label="Delay Threshold">
          <ClockCircleOutlined /> {policy.delayThreshold} min
        </Descriptions.Item>
      </Descriptions>
      
      {policy.status === "Active" && !policy.isPaid && policy.departureTime < Math.floor(Date.now() / 1000) && (
        <Alert
          message="Your flight has departed. You can check for claim eligibility once flight data is available."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginTop: 16 }}
        />
      )}

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        {isEligibleForClaim(policy) && (
          <Button type="primary" onClick={() => onClaim(policy.policyId)} loading={isProcessing}>
            Claim Payout
          </Button>
        )}
        {isEligibleForCancellation(policy) && (
          <Button type="default" onClick={() => onCancel(policy.policyId)} loading={isProcessing} style={{ marginLeft: 8 }}>
            Cancel Policy
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ViewPolicy;