import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../components/Web3Provider';
import { Policy, formatPolicy, PolicyStatus } from '../../services/flightInsurance';
import { Card, Select, Alert, Typography, Spin, Button } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, WalletOutlined } from '@ant-design/icons';
import ClaimStatus from '../../components/ClaimStatus';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const ClaimPage: React.FC = () => {
  const { account, flightInsuranceContract } = useWeb3();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      if (!account || !flightInsuranceContract) return;
      setIsLoading(true);
      setError(null);

      try {
        const policyIds = await flightInsuranceContract.getPoliciesByUser(account);
        if (policyIds.length === 0) {
          setPolicies([]);
          return;
        }

        const policyDetails = await Promise.all(
          policyIds.map(async (id: bigint) => {
            const policyData = await flightInsuranceContract.getPolicyDetails(id);
            return formatPolicy(policyData);
          })
        );

        // Filter policies that are claimable
        const claimablePolicies = policyDetails.filter(
          (p) => p.status === PolicyStatus.Active && !p.isPaid && !p.isClaimed
        );

        setPolicies(claimablePolicies);
      } catch (err: any) {
        setError(err.message || 'Failed to load policies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, [account, flightInsuranceContract]);

  const handlePolicySelect = (policyId: number) => {
    const policy = policies.find((p) => p.policyId === policyId);
    setSelectedPolicy(policy || null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Title level={2}>Claim Insurance Policy</Title>

      {!account ? (
        <Alert
          message="Wallet Not Connected"
          description="Please connect your wallet to claim a policy."
          type="warning"
          showIcon
          icon={<WalletOutlined />}
          style={{ marginBottom: '20px' }}
        />
      ) : isLoading ? (
        <Spin tip="Loading policies..." />
      ) : policies.length === 0 ? (
        <Alert
          message="No Claimable Policies"
          description="You have no active policies eligible for claims."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      ) : (
        <>
          <Paragraph>Select a policy to check its claim status.</Paragraph>
          <Select
            placeholder="Select a policy"
            style={{ width: '100%', marginBottom: '20px' }}
            onChange={handlePolicySelect}
          >
            {policies.map((policy) => (
              <Option key={policy.policyId} value={policy.policyId}>
                Policy #{policy.policyId} - Flight {policy.flightNumber}
              </Option>
            ))}
          </Select>

          {selectedPolicy && <ClaimStatus claim={selectedPolicy} />}
        </>
      )}
    </div>
  );
};

export default ClaimPage;
