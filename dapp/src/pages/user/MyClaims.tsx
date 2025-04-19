import React, { useEffect, useState } from "react";
import { Table, Typography, Spin, message, Tag } from "antd";
import { useWeb3 } from "@/components/Web3Provider";
import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyStatus, FlightUserPolicy } from "@/types/FlightPolicy";

const { Title } = Typography;

const MyClaims = () => {
  const { insurerContract, account } = useWeb3();
  const { getUserFlightPolicies } = useFlightInsurance();

  const [policies, setPolicies] = useState<FlightUserPolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!account) return;
      try {
        setLoading(true);
        const userPolicies = await getUserFlightPolicies(account);
        setPolicies(userPolicies.filter((p) => p.status === FlightPolicyStatus.Claimed));
      } catch (err) {
        message.error("Failed to fetch claims");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [account, insurerContract]);

  const columns = [
    {
      title: "Policy ID",
      dataIndex: "policyId",
      key: "policyId",
    },
    {
      title: "Flight Number",
      dataIndex: "flightNumber",
      key: "flightNumber",
    },
    {
      title: "Departure Time",
      dataIndex: "departureTime",
      key: "departureTime",
      render: (value: number) => new Date(value * 1000).toLocaleString(),
    },
    {
      title: "Payout (ETH)",
      dataIndex: "payoutToDate",
      key: "payoutToDate",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: () => <Tag color="blue">Claimed</Tag>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Title level={2}>My Received Claims</Title>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          dataSource={policies}
          columns={columns}
          rowKey="policyId"
          pagination={{ pageSize: 8 }}
        />
      )}
    </div>
  );
};

export default MyClaims;
