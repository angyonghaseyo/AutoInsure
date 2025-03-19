import React, { useState } from "react";
import { Card, Row, Col, Typography, Button, Modal, Grid, Spin, Menu, Checkbox, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { DollarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import AddEditPolicy from "../../components/AddEditPolicy";
import { Policy, PolicyStatus } from "../../services/flightInsurance";

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Sample Policies Catalogue
const samplePolicies: Policy[] = [
  {
    policyId: 1,
    name: "Basic Flight Delay Cover",
    premium: "0.03 ETH",
    payoutAmount: "0.09 ETH",
    delayThreshold: 60,
    policyholder: "",
    flightNumber: "",
    departureTime: 0,
    isPaid: false,
    isClaimed: false,
    status: PolicyStatus.Active,
  },
  {
    policyId: 2,
    name: "Standard Flight Protection",
    premium: "0.05 ETH",
    payoutAmount: "0.15 ETH",
    delayThreshold: 90,
    policyholder: "",
    flightNumber: "",
    departureTime: 0,
    isPaid: false,
    isClaimed: false,
    status: PolicyStatus.Active,
  },
];

const FilterDropdown = ({ options, selectedFilters, setSelectedFilters }) => {
  // Handle checkbox change
  const handleCheckboxChange = (checkedValues) => {
    setSelectedFilters(checkedValues);
  };

  // Generate menu items dynamically
  const menu = (
    <Menu>
      <Menu.Item>
        <Checkbox.Group style={{ display: "flex", flexDirection: "column" }} options={options} value={selectedFilters} onChange={handleCheckboxChange} />
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      <Button>
        Filter <DownOutlined />
      </Button>
    </Dropdown>
  );
};

const InsurerPolicies: React.FC = () => {
  const screens = useBreakpoint();
  const [editedPolicy, setEditedPolicy] = useState<Policy | null>(null);
  const [addPolicy, setAddPolicy] = useState<Boolean>(false);

  const filterOptions = [
    { label: "Active", value: "active" }, // In use by users
    { label: "Inactive", value: "inactive" }, // Not in use by users (including cancelled)
    { label: "Current", value: "current" }, // Valid policies
    { label: "Deleted", value: "deleted" }, // Invalid policies
  ];

  const getFilterDescription = () => {
    if (selectedFilters.length === 0) return "All policies"; // Default case
    if (selectedFilters.length === filterOptions.length) return "All policies";
    return `${selectedFilters.map((filter) => filterOptions.find((opt) => opt.value === filter)?.label).join(", ")} policies`;
  };

  const [selectedFilters, setSelectedFilters] = useState([]);

  const handleEditClick = (policy: Policy) => {
    setEditedPolicy({ ...policy });
  };

  const handleDeleteClick = (policy: Policy) => {};

  const handleAddClick = () => {
    setAddPolicy(true);
  };

  const handleCloseModal = () => {
    setEditedPolicy(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        {/* Title on the left */}
        <Title level={2} style={{ marginBottom: 0 }}>
          Insurance Policies
        </Title>

        {/* Right-side container for FilterDropdown and Button */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <FilterDropdown options={filterOptions} selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} />
          <Button type="primary" onClick={() => handleAddClick()}>
            Add Policy
          </Button>
        </div>
      </div>

      <Paragraph>{getFilterDescription()}</Paragraph>
      <Row gutter={[24, 24]} justify="start">
        {samplePolicies.map((policy) => (
          <Col xs={24} sm={12} md={8} lg={6} key={policy.policyId}>
            <Card title={policy.name} bordered>
              <p>
                <strong>Premium:</strong> <DollarOutlined /> {policy.premium}
              </p>
              <p>
                <strong>Payout Amount:</strong> <DollarOutlined /> {policy.payoutAmount}
              </p>
              <p>
                <strong>Delay Threshold:</strong> <ClockCircleOutlined /> {policy.delayThreshold} min
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <Button type="primary" onClick={() => handleEditClick(policy)}>
                  Edit Policy
                </Button>
                <Button danger onClick={() => handleDeleteClick(policy)}>
                  Delete Policy
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal title="Edit Policy" visible={!!editedPolicy} onCancel={handleCloseModal} footer={null} width={600}>
        {editedPolicy ? <AddEditPolicy selectedPolicy={editedPolicy} onClose={handleCloseModal} /> : <Spin tip="Loading policy details..." />}
      </Modal>

      {/* <Modal title="Add Policy" visible={!!editedPolicy} onCancel={handleCloseModal} footer={null} width={600}>
        {addPolicy ? <AddEditPolicy selectedPolicy={addPolicy} onClose={handleCloseModal} /> : <Spin tip="Loading policy details..." />}
      </Modal> */}
    </div>
  );
};

export default InsurerPolicies;
