import React, { useEffect, useState, useMemo } from "react";
import { Table, Typography, Input, Tag, Row, Col, Statistic, Card, Spin, message } from "antd";
import { useWeb3 } from "@/components/Web3Provider";
import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyStatus, FlightPolicyTemplate, FlightUserPolicy } from "@/types/FlightPolicy";

const { Title } = Typography;

const InsurerClaimsOverview: React.FC = () => {
  const { getAllFlightPolicies, getAllFlightPolicyTemplates } = useFlightInsurance();
  const { insurerContract } = useWeb3();

  const [policies, setPolicies] = useState<FlightUserPolicy[]>([]);
  const [templateMap, setTemplateMap] = useState<Map<string, FlightPolicyTemplate>>(new Map());
  const [buyerFilter, setBuyerFilter] = useState<string>("");
  const [flightFilter, setFlightFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allPolicies, allTemplates] = await Promise.all([getAllFlightPolicies(), getAllFlightPolicyTemplates()]);

        const map = new Map<string, FlightPolicyTemplate>();
        allTemplates.forEach((tpl) => map.set(tpl.templateId, tpl));

        setPolicies(allPolicies);
        setTemplateMap(map);
      } catch (err: any) {
        message.error("Failed to fetch policy or template data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (insurerContract) {
      fetchData();
    }
  }, [insurerContract]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesBuyer = buyerFilter === "" || p.buyer.toLowerCase().includes(buyerFilter.toLowerCase());
      const matchesFlight = flightFilter === "" || p.flightNumber.toLowerCase().includes(flightFilter.toLowerCase());
      return matchesBuyer && matchesFlight;
    });
  }, [policies, buyerFilter, flightFilter]);

  const summary = useMemo(() => {
    let totalPremium = 0;
    let totalPayout = 0;

    for (const policy of filteredPolicies) {
      const template = templateMap.get(policy.template.templateId);
      if (template) {
        totalPremium += parseFloat(template.premium || "0");
      }
      totalPayout += parseFloat(policy.payoutToDate || "0");
    }

    const revenue = totalPremium;
    const cost = totalPayout;
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { revenue, cost, profit, margin };
  }, [filteredPolicies, templateMap]);

  const columns = [
    {
      title: "Policy ID",
      dataIndex: "policyId",
      key: "policyId",
    },
    {
      title: "Buyer",
      dataIndex: "buyer",
      key: "buyer",
    },
    {
      title: "Flight",
      dataIndex: "flightNumber",
      key: "flightNumber",
    },
    {
      title: "Premium (ETH)",
      key: "premium",
      render: (_: any, record: FlightUserPolicy) => {
        return templateMap.get(record.template.templateId)?.premium ?? "-";
      },
    },
    {
      title: "Payout To Date (ETH)",
      dataIndex: "payoutToDate",
      key: "payoutToDate",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: FlightPolicyStatus) => {
        const colorMap = {
          [FlightPolicyStatus.Active]: "green",
          [FlightPolicyStatus.Expired]: "orange",
          [FlightPolicyStatus.Claimed]: "blue",
        };
        const textMap = {
          [FlightPolicyStatus.Active]: "Active",
          [FlightPolicyStatus.Expired]: "Expired",
          [FlightPolicyStatus.Claimed]: "Claimed",
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Title level={2}>Claims & Payouts Overview</Title>

      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={6}>
          <Input placeholder="Filter by buyer address" value={buyerFilter} onChange={(e) => setBuyerFilter(e.target.value)} />
        </Col>
        <Col span={6}>
          <Input placeholder="Filter by flight number" value={flightFilter} onChange={(e) => setFlightFilter(e.target.value)} />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Premiums (ETH)" value={summary.revenue.toFixed(2)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Payouts (ETH)" value={summary.cost.toFixed(2)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Profit (ETH)" value={summary.profit.toFixed(2)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Profit Margin (%)" value={summary.margin.toFixed(2)} />
          </Card>
        </Col>
      </Row>

      {isLoading ? <Spin size="large" /> : <Table dataSource={filteredPolicies} columns={columns} rowKey="policyId" pagination={{ pageSize: 8 }} />}
    </div>
  );
};

export default InsurerClaimsOverview;
