import React, { useEffect, useState } from "react";
import { Table, Typography, Spin, message, Tag, Tabs } from "antd";
import { useWeb3 } from "@/components/Web3Provider";
import { useFlightInsurance } from "@/services/flightInsurance";
import { useBaggageInsurance } from "@/services/baggageInsurance";
import { FlightPolicyStatus, FlightUserPolicy } from "@/types/FlightPolicy";
import { BaggagePolicyStatus, BaggageUserPolicy } from "@/types/BaggagePolicy";

const { Title } = Typography;
const { TabPane } = Tabs;

const MyClaims = () => {
  const { insurerContract, account } = useWeb3();
  const { getUserFlightPolicies } = useFlightInsurance();
  const { getUserBaggagePolicies } = useBaggageInsurance();

  const [flightPolicies, setFlightPolicies] = useState<FlightUserPolicy[]>([]);
  const [baggagePolicies, setBaggagePolicies] = useState<BaggageUserPolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!account) return;
      try {
        setLoading(true);

        const [userFlights, userBaggage] = await Promise.all([
          getUserFlightPolicies(account),
          getUserBaggagePolicies(account),
        ]);

        setFlightPolicies(userFlights.filter((p) => p.status === FlightPolicyStatus.Claimed));
        setBaggagePolicies(userBaggage.filter((p) => p.status === BaggagePolicyStatus.Claimed));
      } catch (err) {
        message.error("Failed to fetch claims");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [account, insurerContract]);

  const flightColumns = [
    { title: "Policy ID", dataIndex: "policyId", key: "policyId" },
    { title: "Flight Number", dataIndex: "flightNumber", key: "flightNumber" },
    {
      title: "Departure Time",
      dataIndex: "departureTime",
      key: "departureTime",
      render: (value: number) => new Date(value * 1000).toLocaleString(),
    },
    { title: "Payout (ETH)", dataIndex: "payoutToDate", key: "payoutToDate" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: () => <Tag color="blue">Claimed</Tag>,
    },
  ];

  const baggageColumns = [
    { title: "Policy ID", dataIndex: "policyId", key: "policyId" },
    { title: "Flight Number", dataIndex: "flightNumber", key: "flightNumber" },
    {
      title: "Departure Time",
      dataIndex: "departureTime",
      key: "departureTime",
      render: (value: number) => new Date(value * 1000).toLocaleString(),
    },
    { title: "Item Description", dataIndex: "itemDescription", key: "itemDescription" },
    { title: "Payout (ETH)", dataIndex: "payoutToDate", key: "payoutToDate" },
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
        <Tabs defaultActiveKey="flight">
          <TabPane tab="Flight Claims" key="flight">
            <Table
              dataSource={flightPolicies}
              columns={flightColumns}
              rowKey="policyId"
              pagination={{ pageSize: 8 }}
            />
          </TabPane>

          <TabPane tab="Baggage Claims" key="baggage">
            <Table
              dataSource={baggagePolicies}
              columns={baggageColumns}
              rowKey="policyId"
              pagination={{ pageSize: 8 }}
            />
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default MyClaims;
