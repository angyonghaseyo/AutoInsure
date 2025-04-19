import React, { useEffect, useState } from "react";
import { Drawer, Statistic, Row, Col, Table } from "antd";
import { useFlightInsurance } from "../services/flightInsurance";
import { useBaggageInsurance } from "../services/baggageInsurance";
import { FlightPolicyStatus, FlightPolicyTemplate, FlightUserPolicy } from "../types/FlightPolicy";
import { BaggagePolicyStatus, BaggagePolicyTemplate, BaggageUserPolicy } from "../types/BaggagePolicy";

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
      if (type === "flight") {
        const flightPolicies = await getUserFlightPoliciesByTemplate(policyTemplate.templateId);
        setUserFlightPolicies(flightPolicies);
      } else if (type === "baggage") {
        const baggagePolicies = await getUserBaggagePoliciesByTemplate(policyTemplate.templateId);
        setUserBaggagePolicies(baggagePolicies);
      }
    };

    fetchUserPolicies();
  }, [policyTemplate, type]);

  const flightColumns = [
    {
      title: "Flight Number",
      dataIndex: "flightNumber",
      key: "flightNumber",
    },
    {
      title: "Departure Time",
      dataIndex: "departureTime",
      key: "departureTime",
      render: (epoch: number) => new Date(epoch * 1000).toLocaleString("en-US", { timeZone: "Asia/Singapore" }),
    },
    {
      title: "Date Purchased",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (epoch: number) => new Date(epoch * 1000).toLocaleDateString("en-US", { timeZone: "Asia/Singapore" }),
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
      title: "Flight Number",
      dataIndex: "flightNumber",
      key: "flightNumber",
    },
    {
      title: "Departure Time",
      dataIndex: "departureTime",
      key: "departureTime",
      render: (epoch: number) => new Date(epoch * 1000).toLocaleString("en-US", { timeZone: "Asia/Singapore" }),
    },
    {
      title: "Date Purchased",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (epoch: number) => new Date(epoch * 1000).toLocaleDateString("en-US", { timeZone: "Asia/Singapore" }),
    },
    {
      title: "Payout To Date",
      dataIndex: "payoutToDate",
      key: "payoutToDate",
      render: (payout: number) => `${payout} ETH`,
    },
  ];

  const totalPolicies = type === "flight" ? userFlightPolicies.length : userBaggagePolicies.length;
  const activePolicies = type === "flight"
    ? userFlightPolicies.filter(p => p.status === FlightPolicyStatus.Active).length
    : userBaggagePolicies.filter(p => p.status === BaggagePolicyStatus.Active).length;

  const expiredPolicies = type === "flight"
    ? userFlightPolicies.filter(p => p.status === FlightPolicyStatus.Expired).length
    : userBaggagePolicies.filter(p => p.status === BaggagePolicyStatus.Expired).length;

  const claimedPolicies = type === "flight"
    ? userFlightPolicies.filter(p => p.status === FlightPolicyStatus.Claimed).length
    : userBaggagePolicies.filter(p => p.status === BaggagePolicyStatus.Claimed).length;

  return (
    <Drawer
      title={`Purchased Policies ${policyTemplate.name ? `for ${policyTemplate.name}` : ""}`}
      placement="right"
      width={550}
      onClose={() => setDrawerVisible(false)}
      open={visible}
    >
      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={6}><Statistic title="Total" value={totalPolicies} /></Col>
        <Col span={6}><Statistic title="Active" value={activePolicies} /></Col>
        <Col span={6}><Statistic title="Expired" value={expiredPolicies} /></Col>
        <Col span={6}><Statistic title="Claimed" value={claimedPolicies} /></Col>
      </Row>

      {type === "flight" && (
        <Table
          dataSource={userFlightPolicies}
          columns={flightColumns}
          rowKey={(policy) => `${policy.policyId}`}
          pagination={{ pageSize: 5 }}
        />
      )}

      {type === "baggage" && (
        <Table
          dataSource={userBaggagePolicies}
          columns={baggageColumns}
          rowKey={(policy) => `${policy.policyId}`}
          pagination={{ pageSize: 5 }}
        />
      )}
    </Drawer>
  );
};

export default PolicyTemplateDrawer;
