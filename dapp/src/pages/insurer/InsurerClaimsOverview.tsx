import React, { useEffect, useState, useMemo } from "react";
import { Table, Typography, Input, Tag, Row, Col, Statistic, Card, Spin, message } from "antd";
import { useWeb3 } from "@/components/Web3Provider";
import { useFlightInsurance } from "@/services/flightInsurance";
import { useBaggageInsurance } from "@/services/baggageInsurance";
import {
  FlightPolicyStatus,
  FlightPolicyTemplate,
  FlightUserPolicy
} from "@/types/FlightPolicy";
import {
  BaggagePolicyStatus,
  BaggagePolicyTemplate,
  BaggageUserPolicy
} from "@/types/BaggagePolicy";

const { Title } = Typography;

const InsurerClaimsOverview = () => {
  const { insurerContract } = useWeb3();
  const {
    getAllFlightPolicies,
    getAllFlightPolicyTemplates
  } = useFlightInsurance();
  const {
    getAllBaggagePolicies,
    getAllBaggagePolicyTemplates
  } = useBaggageInsurance();

  const [flightPolicies, setFlightPolicies] = useState<FlightUserPolicy[]>([]);
  const [baggagePolicies, setBaggagePolicies] = useState<BaggageUserPolicy[]>([]);
  const [flightTemplateMap, setFlightTemplateMap] = useState<Map<string, FlightPolicyTemplate>>(new Map());
  const [baggageTemplateMap, setBaggageTemplateMap] = useState<Map<string, BaggagePolicyTemplate>>(new Map());
  const [buyerFilter, setBuyerFilter] = useState<string>("");
  const [flightFilter, setFlightFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          allFlightPolicies,
          allFlightTemplates,
          allBaggagePolicies,
          allBaggageTemplates
        ] = await Promise.all([
          getAllFlightPolicies(),
          getAllFlightPolicyTemplates(),
          getAllBaggagePolicies(),
          getAllBaggagePolicyTemplates()
        ]);

        const flightMap = new Map<string, FlightPolicyTemplate>();
        allFlightTemplates.forEach((tpl) => flightMap.set(tpl.templateId, tpl));
        setFlightTemplateMap(flightMap);
        setFlightPolicies(allFlightPolicies);

        const baggageMap = new Map<string, BaggagePolicyTemplate>();
        allBaggageTemplates.forEach((tpl) => baggageMap.set(tpl.templateId, tpl));
        setBaggageTemplateMap(baggageMap);
        setBaggagePolicies(allBaggagePolicies);
      } catch (err) {
        message.error("Failed to fetch flight or baggage data.");
      } finally {
        setLoading(false);
      }
    };

    if (insurerContract) fetchData();
  }, [insurerContract]);

  const filteredFlightPolicies = useMemo(() => {
    return flightPolicies.filter(
      (p) =>
        (buyerFilter === "" || p.buyer.toLowerCase().includes(buyerFilter.toLowerCase())) &&
        (flightFilter === "" || p.flightNumber.toLowerCase().includes(flightFilter.toLowerCase()))
    );
  }, [flightPolicies, buyerFilter, flightFilter]);

  const filteredBaggagePolicies = useMemo(() => {
    return baggagePolicies.filter(
      (p) =>
        buyerFilter === "" || p.buyer.toLowerCase().includes(buyerFilter.toLowerCase())
    );
  }, [baggagePolicies, buyerFilter]);

  const summary = useMemo(() => {
    let totalPremium = 0;
    let totalPayout = 0;

    for (const p of filteredFlightPolicies) {
      const tpl = flightTemplateMap.get(p.template.templateId);
      totalPremium += tpl ? parseFloat(tpl.premium || "0") : 0;
      totalPayout += parseFloat(p.payoutToDate || "0");
    }

    for (const p of filteredBaggagePolicies) {
      const tpl = baggageTemplateMap.get(p.template.templateId);
      totalPremium += tpl ? parseFloat(tpl.premium || "0") : 0;
      totalPayout += parseFloat(p.payoutToDate || "0");
    }

    const profit = totalPremium - totalPayout;
    const margin = totalPremium > 0 ? (profit / totalPremium) * 100 : 0;

    return { revenue: totalPremium, cost: totalPayout, profit, margin };
  }, [filteredFlightPolicies, filteredBaggagePolicies, flightTemplateMap, baggageTemplateMap]);

  const flightColumns = [
    { title: "Policy ID", dataIndex: "policyId", key: "policyId" },
    { title: "Buyer", dataIndex: "buyer", key: "buyer" },
    { title: "Flight", dataIndex: "flightNumber", key: "flightNumber" },
    {
      title: "Premium (ETH)",
      render: (_: any, record: FlightUserPolicy) => flightTemplateMap.get(record.template.templateId)?.premium ?? "-"
    },
    { title: "Payout To Date (ETH)", dataIndex: "payoutToDate", key: "payoutToDate" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: FlightPolicyStatus) => <Tag color={
        status === FlightPolicyStatus.Active ? "green" :
        status === FlightPolicyStatus.Expired ? "orange" : "blue"
      }>{FlightPolicyStatus[status]}</Tag>
    },
  ];

  const baggageColumns = [
    { title: "Policy ID", dataIndex: "policyId", key: "policyId" },
    { title: "Buyer", dataIndex: "buyer", key: "buyer" },
    { title: "Item", dataIndex: "itemDescription", key: "itemDescription" },
    {
      title: "Premium (ETH)",
      render: (_: any, record: BaggageUserPolicy) => baggageTemplateMap.get(record.template.templateId)?.premium ?? "-"
    },
    { title: "Payout To Date (ETH)", dataIndex: "payoutToDate", key: "payoutToDate" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: BaggagePolicyStatus) => <Tag color={
        status === BaggagePolicyStatus.Active ? "green" :
        status === BaggagePolicyStatus.Expired ? "orange" : "blue"
      }>{BaggagePolicyStatus[status]}</Tag>
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
        <Col span={6}><Card><Statistic title="Total Premiums (ETH)" value={summary.revenue.toFixed(2)} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Payouts (ETH)" value={summary.cost.toFixed(2)} /></Card></Col>
        <Col span={6}><Card><Statistic title="Profit (ETH)" value={summary.profit.toFixed(2)} /></Card></Col>
        <Col span={6}><Card><Statistic title="Profit Margin (%)" value={summary.margin.toFixed(2)} /></Card></Col>
      </Row>

      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <Title level={3}>Flight Policies</Title>
          <Table dataSource={filteredFlightPolicies} columns={flightColumns} rowKey="policyId" pagination={{ pageSize: 6 }} />

          <Title level={3} style={{ marginTop: 48 }}>Baggage Policies</Title>
          <Table dataSource={filteredBaggagePolicies} columns={baggageColumns} rowKey="policyId" pagination={{ pageSize: 6 }} />
        </>
      )}
    </div>
  );
};

export default InsurerClaimsOverview;
