import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Button, Modal, Tag, Select, message, Statistic } from "antd";
import { DollarOutlined, ClockCircleOutlined, PlusOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import CreatePolicyTemplate from "@/components/CreatePolicyTemplate";
import { useFlightInsurance } from "@/services/flightInsurance";
import { useWeb3 } from "@/components/Web3Provider";
import PolicyTemplateDrawer from "@/components/PolicyTemplateDrawer";
import { FlightPolicyTemplate, FlightPolicyTemplateStatus } from "@/types/FlightPolicy";
import EditPolicyTemplate from "@/components/EditPolicyTemplate";

const { Title } = Typography;
const { Option } = Select;

/**
 * Maps a policy template status to tag color.
 */
const getStatusColor = (status: FlightPolicyTemplateStatus): string => {
  switch (status) {
    case FlightPolicyTemplateStatus.Active:
      return "green";
    case FlightPolicyTemplateStatus.Deactivated:
      return "red";
    default:
      return "gray";
  }
};

const InsurerPolicyTemplates = () => {
  const { getAllFlightPolicyTemplates, deactivateFlightPolicyTemplate, getAllFlightPolicies } = useFlightInsurance();
  const { insurerContract } = useWeb3();

  const [templates, setTemplates] = useState<FlightPolicyTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FlightPolicyTemplate[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPolicyTemplate, setEditPolicyTemplate] = useState<FlightPolicyTemplate>();
  const [messageApi, contextHolder] = message.useMessage();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewPolicyTemplate, setViewPolicyTemplate] = useState<FlightPolicyTemplate>();
  const [policyCount, setPolicyCount] = useState(0);

  /**
   * Load policy templates from the blockchain.
   */
  const fetchTemplates = async () => {
    try {
      const result = await getAllFlightPolicyTemplates();
      setTemplates(result);
      setFilteredTemplates(result);
    } catch (err) {
      console.error("Error loading templates:", err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    const fetchPolicies = async () => {
      try {
        const policies = await getAllFlightPolicies();
        setPolicyCount(policies.length);
      } catch (error) {
        console.error("Error fetching policies:", error);
        message.error("Failed to fetch policies.");
      }
    };
    fetchPolicies();
  }, [insurerContract]);

  /**
   * Filter templates by status.
   */
  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    if (value === "all") {
      setFilteredTemplates(templates);
    } else {
      const numeric = parseInt(value);
      setFilteredTemplates(templates.filter((tpl) => tpl.status === numeric));
    }
  };

  /**
   * Handle add or delete actions.
   */
  const handleTemplateAction = async (action: "add" | "delete" | "edit", template?: FlightPolicyTemplate) => {
    if (action === "delete" && template) {
      try {
        await deactivateFlightPolicyTemplate(template.templateId);
        messageApi.success(`Template #${template.templateId} deactivated.`);
        fetchTemplates();
      } catch (error) {
        messageApi.error("Failed to deactivate template.");
      }
    } else if (action === "add") {
      setShowCreateModal(true);
    } else if (action === "edit" && template) {
      setShowEditModal(true);
      setEditPolicyTemplate(template);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {contextHolder}

      <Title level={2}>Flight Policy Templates</Title>

      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Templates" value={templates.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Active" value={templates.filter((tpl) => tpl.status === FlightPolicyTemplateStatus.Active).length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Deactivated " value={templates.filter((tpl) => tpl.status === FlightPolicyTemplateStatus.Deactivated).length} />
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
            <Option value="all">All Statuses</Option>
            <Option value={FlightPolicyTemplateStatus.Active.toString()}>Active</Option>
            <Option value={FlightPolicyTemplateStatus.Deactivated.toString()}>Deactivated</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleTemplateAction("add")}>
            Add Template
          </Button>
        </div>
      </div>

      {/* Template Grid */}
      <Row gutter={[24, 24]}>
        {filteredTemplates.map((tpl) => (
          <Col xs={24} sm={12} md={8} lg={6} key={tpl.templateId}>
            <Card
              title={tpl.name}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              extra={<Tag color={getStatusColor(tpl.status)}>{FlightPolicyTemplateStatus[tpl.status]}</Tag>}
            >
              <div>
                <p>{tpl.description}</p>
                <p>
                  <strong>Premium:</strong> <DollarOutlined /> {tpl.premium} ETH
                </p>
                <p>
                  <strong>Payout/Hour:</strong> <DollarOutlined /> {tpl.payoutPerHour} ETH
                </p>
                <p>
                  <strong>Max Payout:</strong> {tpl.maxTotalPayout} ETH
                </p>
                <p>
                  <strong>Delay Threshold:</strong> <ClockCircleOutlined /> {tpl.delayThresholdHours} hrs
                </p>
                <p>
                  <strong>Coverage Duration:</strong> {tpl.coverageDurationDays} days
                </p>
              </div>

              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  icon={<EyeOutlined />}
                  onClick={async () => {
                    setDrawerVisible(true);
                    setViewPolicyTemplate(tpl);
                  }}
                  style={{ flex: 1 }}
                >
                  View Purchased Policies
                </Button>
                <Button onClick={() => handleTemplateAction("edit", tpl)} disabled={tpl.status === FlightPolicyTemplateStatus.Deactivated} style={{ flex: 1 }}>
                  Edit Template
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleTemplateAction("delete", tpl)}
                  disabled={tpl.status === FlightPolicyTemplateStatus.Deactivated}
                  style={{ flex: 1 }}
                >
                  Deactivate
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create Policy Template Modal */}
      <Modal open={showCreateModal} onCancel={() => setShowCreateModal(false)} footer={null} destroyOnClose>
        <CreatePolicyTemplate onClose={() => setShowCreateModal(false)} onUpdate={fetchTemplates} />
      </Modal>

      {/* Edit Policy Template Modal */}
      <Modal open={showEditModal} onCancel={() => setShowEditModal(false)} footer={null} destroyOnClose>
        {editPolicyTemplate && <EditPolicyTemplate onClose={() => setShowEditModal(false)} onUpdate={fetchTemplates} policyTemplate={editPolicyTemplate} />}
      </Modal>

      {viewPolicyTemplate && <PolicyTemplateDrawer setDrawerVisible={setDrawerVisible} policyTemplate={viewPolicyTemplate} visible={drawerVisible} />}
    </div>
  );
};

export default InsurerPolicyTemplates;
