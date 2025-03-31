import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Button, Modal, Tag, Select, message } from "antd";
import { DollarOutlined, ClockCircleOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import CreatePolicyTemplate from "@/components/CreatePolicyTemplate";
import { useFlightInsurance, FlightPolicyTemplate, FlightPolicyTemplateStatus } from "@/services/flightInsurance";
import { useWeb3 } from "@/components/Web3Provider";

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
  const { getAllFlightPolicyTemplates, deactivateFlightPolicyTemplate } = useFlightInsurance();
  const { insurerContract } = useWeb3();

  const [templates, setTemplates] = useState<FlightPolicyTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FlightPolicyTemplate[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

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
  const handleTemplateAction = async (action: "add" | "delete", template?: FlightPolicyTemplate) => {
    if (action === "delete" && template) {
      try {
        await deactivateFlightPolicyTemplate(template.templateId);
        messageApi.success(`Template #${template.templateId} deactivated.`);
        fetchTemplates();
      } catch (error) {
        messageApi.error("Failed to deactivate template.");
      }
    } else if (action === "add") {
      setShowModal(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {contextHolder}

      {/* Header with Filter and Add Button */}
      <div className="flex justify-between mb-5 items-center">
        <Title level={2}>Flight Policy Templates</Title>

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
              style={{ minHeight: 340, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
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

              <div style={{ marginTop: "auto" }}>
                {tpl.status === FlightPolicyTemplateStatus.Active ? (
                  <Button danger icon={<DeleteOutlined />} onClick={() => handleTemplateAction("delete", tpl)}>
                    Deactivate
                  </Button>
                ) : (
                  <div style={{ visibility: "hidden" }}>
                    <Button icon={<DeleteOutlined />}>Deactivate</Button>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create Policy Template Modal */}
      <Modal open={showModal} onCancel={() => setShowModal(false)} footer={null} destroyOnClose>
        <CreatePolicyTemplate onClose={() => setShowModal(false)} onUpdate={fetchTemplates} />
      </Modal>
    </div>
  );
};

export default InsurerPolicyTemplates;
