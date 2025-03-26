import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Modal,
  Spin,
  Tag,
  Select,
  message,
} from "antd";
import {
  DollarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import AddEditPolicy from "../../components/AddEditPolicy";
import {
  useFlightInsurance,
  PolicyStatus,
  PolicyTemplate,
} from "@/services/flightInsurance";

const { Title } = Typography;
const { Option } = Select;

/**
 * Maps a policy status to a display color for the Tag.
 */
const getStatusColor = (status: PolicyStatus): string => {
  switch (status) {
    case PolicyStatus.Active:
      return "green";
    case PolicyStatus.Expired:
      return "orange";
    case PolicyStatus.Claimed:
      return "blue";
    case PolicyStatus.Discontinued:
      return "red";
    default:
      return "gray";
  }
};

const InsurerPolicies = () => {
  const { getCompanyPolicies, deletePolicyTemplate } = useFlightInsurance();

  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PolicyTemplate[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [showAddModal, setShowAddModal] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  /**
   * Fetch all templates and populate state.
   */
  const fetchTemplates = async () => {
    try {
      const result = await getCompanyPolicies();
      setTemplates(result);
      setFilteredTemplates(result);
    } catch (err) {
      console.error("Error loading templates:", err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  /**
   * Handles filtering the displayed policy templates by status.
   */
  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    if (value === "all") {
      setFilteredTemplates(templates);
    } else {
      const numericStatus = parseInt(value);
      setFilteredTemplates(
        templates.filter((tpl) => Number(tpl.status) === numericStatus)
      );
    }
  };

  /**
   * Handles delete and add actions.
   */
  const handlePolicyAction = async (
    action: "edit" | "delete" | "add",
    template?: PolicyTemplate
  ) => {
    if (action === "delete" && template) {
      try {
        await deletePolicyTemplate(template.templateId);
        messageApi.success(`Template #${template.templateId} deleted.`);
        fetchTemplates();
      } catch (error) {
        messageApi.error("Failed to delete policy template.");
      }
    } else if (action === "add") {
      setShowAddModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {contextHolder}

      {/* Header section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ marginBottom: 0 }}>
          Policy Templates
        </Title>

        <div style={{ display: "flex", gap: "10px" }}>
          <Select
            defaultValue="all"
            onChange={handleStatusFilter}
            style={{ width: 200 }}
          >
            <Option value="all">All Statuses</Option>
            <Option value={PolicyStatus.Active.toString()}>Active</Option>
            <Option value={PolicyStatus.Expired.toString()}>Expired</Option>
            <Option value={PolicyStatus.Claimed.toString()}>Claimed</Option>
            <Option value={PolicyStatus.Discontinued.toString()}>
              Discontinued
            </Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handlePolicyAction("add")}
          >
            Add Template
          </Button>
        </div>
      </div>

      {/* Template Cards */}
      <Row gutter={[24, 24]}>
        {filteredTemplates.map((tpl) => (
          <Col xs={24} sm={12} md={8} lg={6} key={tpl.templateId}>
            <Card
              title={`Template #${tpl.templateId}`}
              bordered
              extra={
                <Tag color={getStatusColor(tpl.status)}>
                  {PolicyStatus[tpl.status]}
                </Tag>
              }
            >
              <p>
                <strong>Premium:</strong> <DollarOutlined /> {tpl.premium} ETH
              </p>
              <p>
                <strong>Delay Payout:</strong> <DollarOutlined /> {tpl.delayPayout} ETH/hr
              </p>
              <p>
                <strong>Max Payout:</strong> <DollarOutlined /> {tpl.maxPayout} ETH
              </p>
              <p>
                <strong>Delay Threshold:</strong> <ClockCircleOutlined /> {tpl.delayThreshold} hrs
              </p>
              <p>
                <strong>Active Duration:</strong> {tpl.activeDuration} days
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                }}
              >
                <Button icon={<EditOutlined />} disabled>
                  Edit
                </Button>
                {tpl.status === PolicyStatus.Active && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handlePolicyAction("delete", tpl)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Add Policy Modal */}
      <Modal
        open={showAddModal}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnClose
      >
        {showAddModal ? (
          <AddEditPolicy onClose={handleCloseModal} onUpdate={fetchTemplates} />
        ) : (
          <Spin tip="Loading..." />
        )}
      </Modal>
    </div>
  );
};

export default InsurerPolicies;
