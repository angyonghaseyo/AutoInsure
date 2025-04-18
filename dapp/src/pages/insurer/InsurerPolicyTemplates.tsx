import React, { useEffect, useState } from "react";
import { Button, Card, Col, Dropdown, Modal, Row, Select, Statistic, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useWeb3 } from "../../components/Web3Provider";
import CreatePolicyTemplate from "../../components/CreatePolicyTemplate";
import EditPolicyTemplate from "../../components/EditPolicyTemplate";
import InsurerPolicyTemplateCard from "../../components/InsurerPolicyTemplateCard";
import PolicyTemplateDrawer from "../../components/PolicyTemplateDrawer";
import { useFlightInsurance } from "../../services/flightInsurance";
import { useBaggageInsurance } from "../../services/baggageInsurance";
import { FlightPolicyTemplate, FlightPolicyTemplateStatus } from "../../types/FlightPolicy";
import { BaggagePolicyTemplate, BaggagePolicyTemplateStatus } from "../../types/BaggagePolicy";

const { Title } = Typography;
const { Option } = Select;

const InsurerPolicyTemplates = () => {
  const { getAllFlightPolicyTemplates, deactivateFlightPolicyTemplate, getAllFlightPolicies } = useFlightInsurance();
  const { getAllBaggagePolicyTemplates, deactivateBaggagePolicyTemplate, getAllBaggagePolicies } = useBaggageInsurance();

  const { insurerContract } = useWeb3();

  const [flightTemplates, setFlightTemplates] = useState<FlightPolicyTemplate[]>([]);
  const [baggageTemplates, setBaggageTemplates] = useState<BaggagePolicyTemplate[]>([]);
  const [filteredFlightTemplates, setFilteredFlightTemplates] = useState<FlightPolicyTemplate[]>([]);
  const [filteredBaggageTemplates, setFilteredBaggageTemplates] = useState<BaggagePolicyTemplate[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [type, setType] = useState<"flight" | "baggage">("flight");
  const [editPolicyTemplate, setEditPolicyTemplate] = useState<FlightPolicyTemplate | BaggagePolicyTemplate>();
  const [messageApi, contextHolder] = message.useMessage();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewPolicyTemplate, setViewPolicyTemplate] = useState<FlightPolicyTemplate | BaggagePolicyTemplate>();
  const [policyCount, setPolicyCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const addTemplateMenuItems = [
    {
      key: "flight",
      label: (
        <Button block type="text" onClick={() => handleTemplateAction("add", "flight")}>
          Flight Policy Template
        </Button>
      ),
    },
    {
      key: "baggage",
      label: (
        <Button block type="text" onClick={() => handleTemplateAction("add", "baggage")}>
          Baggage Policy Template
        </Button>
      ),
    },
  ];

  const fetchTemplates = async () => {
    try {
      const flightTemplates = await getAllFlightPolicyTemplates();
      const baggageTenplates = await getAllBaggagePolicyTemplates();

      setFlightTemplates(flightTemplates);
      setBaggageTemplates(baggageTenplates);

      setFilteredFlightTemplates(flightTemplates);
      setFilteredBaggageTemplates(baggageTenplates);
    } catch (err) {
      console.error("Error loading templates:", err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const flightPolicies = await getAllFlightPolicies();
      const baggagePolicies = await getAllBaggagePolicies();
      setPolicyCount(flightPolicies.length + baggagePolicies.length);
    } catch (error) {
      console.error("Error fetching policies:", error);
      message.error("Failed to fetch policies.");
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchPolicies();
  }, [insurerContract]);

  /**
   * Filter templates by status.
   */
  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    if (value === "all") {
      setFilteredFlightTemplates(flightTemplates);
      setFilteredBaggageTemplates(baggageTemplates);
    } else if (value === "flight") {
      setFilteredFlightTemplates(flightTemplates);
      setFilteredBaggageTemplates([]);
    } else if (value === "baggage") {
      setFilteredBaggageTemplates(baggageTemplates);
      setFilteredFlightTemplates([]);
    } else {
      const numeric = parseInt(value);
      setFilteredFlightTemplates(flightTemplates.filter((tpl) => tpl.status === numeric));
      setFilteredBaggageTemplates(baggageTemplates.filter((tpl) => tpl.status === numeric));
    }
  };

  /**
   * Handle add or delete actions.
   */
  const handleTemplateAction = async (action: "add" | "delete" | "edit", type: "flight" | "baggage", template?: FlightPolicyTemplate | BaggagePolicyTemplate) => {
    const isFlight = type === "flight";
    const isLuggage = type === "baggage";

    const showError = (msg: string) => messageApi.error(`Failed to ${action} ${type} template.`);
    const showSuccess = () => messageApi.success(`${type === "flight" ? "Flight" : "Luggage"} Template deactivated.`);

    try {
      if (action === "delete") {
        if (isFlight && template) await deactivateFlightPolicyTemplate(template.templateId);
        if (isLuggage && template) await deactivateBaggagePolicyTemplate(template.templateId);
        showSuccess();
        fetchTemplates();
      } else if (action === "add") {
        setShowCreateModal(true);
        setType(type);
      } else if (action === "edit") {
        setEditPolicyTemplate(template);
        setShowEditModal(true);
        setType(type);
      }
    } catch (err) {
      showError(action);
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {contextHolder}

      <Title level={2}>Policy Templates</Title>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Templates" value={flightTemplates.length + baggageTemplates.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Active"
              value={
                flightTemplates.filter((tpl) => tpl.status === FlightPolicyTemplateStatus.Active).length +
                baggageTemplates.filter((tpl) => tpl.status === BaggagePolicyTemplateStatus.Active).length
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Deactivated"
              value={
                flightTemplates.filter((tpl) => tpl.status === FlightPolicyTemplateStatus.Deactivated).length +
                baggageTemplates.filter((tpl) => tpl.status === BaggagePolicyTemplateStatus.Deactivated).length
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Purchased Policies" value={policyCount} />
          </Card>
        </Col>
      </Row>

      <div className="flex justify-between mb-5 items-center">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <Select defaultValue="all" onChange={handleStatusFilter} style={{ width: 200 }}>
            <Option value="all">All</Option>
            <Option value="flight">Flight</Option>
            <Option value="baggage">Baggage</Option>
            <Option value={FlightPolicyTemplateStatus.Active.toString()}>Active</Option>
            <Option value={FlightPolicyTemplateStatus.Deactivated.toString()}>Deactivated</Option>
          </Select>
          <Dropdown menu={{ items: addTemplateMenuItems }} trigger={["click"]} open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Template
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Flight Templates */}
      {filteredFlightTemplates.length > 0 && <Title level={3}>Flight Templates</Title>}
      <Row gutter={[24, 24]}>
        {filteredFlightTemplates.map((tpl) => (
          <Col xs={24} sm={12} md={8} lg={6} key={tpl.templateId}>
            <InsurerPolicyTemplateCard
              template={tpl}
              type="flight"
              onEdit={() => handleTemplateAction("edit", "flight", tpl)}
              onDelete={() => handleTemplateAction("delete", "flight", tpl)}
              onView={() => {
                setDrawerVisible(true);
                setViewPolicyTemplate(tpl);
              }}
            />
          </Col>
        ))}
      </Row>

      {/* Baggage Templates */}
      {filteredBaggageTemplates.length > 0 && <Title level={3}>Baggage Templates</Title>}
      <Row gutter={[24, 24]}>
        {filteredBaggageTemplates.map((tpl) => (
          <Col xs={24} sm={12} md={8} lg={6} key={tpl.templateId}>
            <InsurerPolicyTemplateCard
              template={tpl}
              type="baggage"
              onEdit={() => handleTemplateAction("edit", "baggage", tpl)}
              onDelete={() => handleTemplateAction("delete", "baggage", tpl)}
              onView={() => {
                setDrawerVisible(true);
                setViewPolicyTemplate(tpl);
              }}
            />
          </Col>
        ))}
      </Row>

      {/* Create Policy Template Modal */}
      <Modal open={showCreateModal} onCancel={() => setShowCreateModal(false)} footer={null} destroyOnClose>
        <CreatePolicyTemplate onClose={() => setShowCreateModal(false)} onUpdate={fetchTemplates} type={type} />
      </Modal>

      {/* Edit Policy Template Modal */}
      <Modal open={showEditModal} onCancel={() => setShowEditModal(false)} footer={null} destroyOnClose>
        {editPolicyTemplate && <EditPolicyTemplate onClose={() => setShowEditModal(false)} onUpdate={fetchTemplates} policyTemplate={editPolicyTemplate} type={type} />}
      </Modal>

      {/* Policy Template Drawer */}
      {viewPolicyTemplate && <PolicyTemplateDrawer setDrawerVisible={setDrawerVisible} policyTemplate={viewPolicyTemplate} visible={drawerVisible} type={type} />}
    </div>
  );
};

export default InsurerPolicyTemplates;
