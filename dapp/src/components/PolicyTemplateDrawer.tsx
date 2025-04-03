import React, { useEffect, useState } from "react";
import { Drawer, Statistic, Row, Col, Table } from "antd";
import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyStatus, FlightPolicyTemplate, FlightUserPolicy } from "@/types/FlightPolicy";

interface PolicyTemplateDrawerProps {
  policyTemplate: FlightPolicyTemplate;
  setDrawerVisible: (visible: boolean) => void;
  visible: boolean;
}

const PolicyTemplateDrawer: React.FC<PolicyTemplateDrawerProps> = ({ policyTemplate, setDrawerVisible, visible }) => {
  const [userPolicies, setUserPolicies] = useState<FlightUserPolicy[]>([]);
  const { getUserPoliciesByTemplate } = useFlightInsurance();

  useEffect(() => {
    const fetchUserPolicies = async () => {
      const result = await getUserPoliciesByTemplate(policyTemplate.templateId);
      setUserPolicies(result);
    };

    fetchUserPolicies();
  }, [policyTemplate]);

  const columns = [
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
      render: (payout: number) => {
        return `${payout} ETH`;
      },
    },
  ];

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
          <Statistic title="Total" value={userPolicies.length} />
        </Col>
        <Col span={6}>
          <Statistic title="Active" value={userPolicies.filter((policy) => policy.status === FlightPolicyStatus.Active).length} />
        </Col>
        <Col span={6}>
          <Statistic title="Expired" value={userPolicies.filter((policy) => policy.status === FlightPolicyStatus.Expired).length} />
        </Col>
        <Col span={6}>
          <Statistic title="Claimed" value={userPolicies.filter((policy) => policy.status === FlightPolicyStatus.Claimed).length} />
        </Col>
      </Row>
      <Table dataSource={userPolicies} columns={columns} rowKey={(policy) => `${policy.policyId}`} pagination={{ pageSize: 5 }} />
    </Drawer>
  );
};

export default PolicyTemplateDrawer;
