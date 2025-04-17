import React, { useEffect, useState } from "react";
import { Drawer, Statistic, Row, Col, Table } from "antd";
import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyStatus, FlightPolicyTemplate, FlightUserPolicy } from "@/types/FlightPolicy";
import { BaggagePolicyStatus, BaggagePolicyTemplate, BaggageUserPolicy } from "@/types/BaggagePolicy";
import { useBaggageInsurance } from "@/services/baggageInsurance";

interface PolicyTemplateDrawerProps {
  policyTemplate: FlightPolicyTemplate | BaggagePolicyTemplate;
  type: "flight" | "baggage";
  setDrawerVisible: (visible: boolean) => void;
  visible: boolean;
}

const PolicyTemplateDrawer: React.FC<PolicyTemplateDrawerProps> = ({ policyTemplate, type, setDrawerVisible, visible }) => {
  const [userFlightPolicies, setUserFlightPolicies] = useState<FlightUserPolicy[]>([]);
  const [userBaggagePolicies, setUserBaggagePolicies] = useState<BaggageUserPolicy[]>([]);
  const { getUserFlightPoliciesByTemplate } = useFlightInsurance();
  const { getUserBaggagePoliciesByTemplate } = useBaggageInsurance();

  useEffect(() => {
    const fetchUserPolicies = async () => {
      const flightPolicies = await getUserFlightPoliciesByTemplate(policyTemplate.templateId);
      setUserFlightPolicies(flightPolicies);
      const baggagePolicies = await getUserBaggagePoliciesByTemplate(policyTemplate.templateId);
      setUserBaggagePolicies(baggagePolicies);
    };

    fetchUserPolicies();
  }, [policyTemplate]);

  const flightColumns = [
    {
      title: "Flight Number",
      dataIndex: "flightNumber",
      key: "flightNumber",
    },
    {
      title: "Date Purchased",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (epoch: number) => {
        const date = new Date(epoch * 1000);
        return date.toLocaleDateString("en-US", { timeZone: "Asia/Singapore" });
      },
    },
    {
      title: "Departure Airport",
      dataIndex: "departureAirportCode",
      key: "departureAirportCode",
    },
    {
      title: "Arrival Airport",
      dataIndex: "arrivalAirportCode",
      key: "arrivalAirportCode",
    },
    {
      title: "Payout To Date",
      dataIndex: "payoutToDate",
      key: "payoutToDate",
      render: (payout: number) => `${payout} ETH`,
    },
  ];

  const baggageColumns = [
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Date Purchased",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (epoch: number) => {
        const date = new Date(epoch * 1000);
        return date.toLocaleDateString("en-US", { timeZone: "Asia/Singapore" });
      },
    },
    {
      title: "Payout To Date",
      dataIndex: "payoutToDate",
      key: "payoutToDate",
      render: (payout: number) => `${payout} ETH`,
    },
  ];

  // Statistics Calculation
  const totalPolicies = userBaggagePolicies.length + userFlightPolicies.length;
  const activePolicies =
    userFlightPolicies.filter((policy) => policy.status === FlightPolicyStatus.Active).length +
    userBaggagePolicies.filter((policy) => policy.status === BaggagePolicyStatus.Active).length;

  const expiredPolicies =
    userFlightPolicies.filter((policy) => policy.status === FlightPolicyStatus.Expired).length +
    userBaggagePolicies.filter((policy) => policy.status === BaggagePolicyStatus.Expired).length;

  const claimedPolicies =
    userFlightPolicies.filter((policy) => policy.status === FlightPolicyStatus.Claimed).length +
    userBaggagePolicies.filter((policy) => policy.status === BaggagePolicyStatus.Claimed).length;

  return (
    <Drawer
      title={`Purchased Policies ${policyTemplate.name ? `for ${policyTemplate.name}` : ""}`}
      placement="right"
      width={500}
      onClose={() => setDrawerVisible(false)}
      visible={visible}
    >
      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={6}>
          <Statistic title="Total" value={totalPolicies} />
        </Col>
        <Col span={6}>
          <Statistic title="Active" value={activePolicies} />
        </Col>
        <Col span={6}>
          <Statistic title="Expired" value={expiredPolicies} />
        </Col>
        <Col span={6}>
          <Statistic title="Claimed" value={claimedPolicies} />
        </Col>
      </Row>

      <Table
        dataSource={userBaggagePolicies}
        columns={baggageColumns}
        rowKey={(policy) => `${policy.policyId}`}
        pagination={{ pageSize: 5 }}
      />
      <Table
        dataSource={userFlightPolicies}
        columns={flightColumns}
        rowKey={(policy) => `${policy.policyId}`}
        pagination={{ pageSize: 5 }}
      />
    </Drawer>
  );
};

export default PolicyTemplateDrawer;
