import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Button, Modal, Spin, Menu, Checkbox, Dropdown, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { DollarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import AddEditPolicy from "../../components/AddEditPolicy";
import { Policy } from "../../services/flightInsurance";
import { useWeb3 } from "@/components/Web3Provider";
import { formatPolicy, PolicyStatus } from "../../services/flightInsurance";

const { Title, Paragraph } = Typography;

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
  const [editedPolicy, setEditedPolicy] = useState<Policy | null>(null);
  const [addPolicy, setAddPolicy] = useState<Boolean>(false);
  const [displayPolicies, setDisplayPolicies] = useState<Policy[]>([]);
  const { insurerContract } = useWeb3();

  const [messageApi] = message.useMessage();

  const filterOptions = [
    { label: "Active", value: "active" }, // In use by users
    { label: "Deleted", value: "deleted" }, // Invalid policies
  ];

  const getFilterDescription = () => {
    if (selectedFilters.length === 0) return "All policies"; // Default case
    if (selectedFilters.length === filterOptions.length) return "All policies";
    return `${selectedFilters.map((filter) => filterOptions.find((opt) => opt.value === filter)?.label).join(", ")} policies`;
  };

  const [selectedFilters, setSelectedFilters] = useState([]);

  const handleCloseModal = () => {
    setEditedPolicy(null);
    setAddPolicy(false);
  };

  const fetchPolicies = async () => {
    if (!insurerContract) {
      return;
    }

    try {
      const policies = await insurerContract.getCompanyPolicies(false);
      const formattedPolicies: Policy[] = policies.map((policy: any) => formatPolicy(policy));
      setDisplayPolicies(formattedPolicies);
    } catch (error) {
      console.error("Error fetching company policies:", error);
    }
  };

  useEffect(() => {
    if (!insurerContract) return;

    const handlePolicyDeleted = (policyTypeId: any) => {
      console.log("Hello");
      messageApi.open({
        type: "success",
        content: `Successfully deleted flight insurance policy with ID: ${policyTypeId}`,
      });

      fetchPolicies();
    };

    insurerContract.on("PolicyDeleted", handlePolicyDeleted);

    fetchPolicies();
    return () => {
      insurerContract.off("PolicyDeleted", handlePolicyDeleted); // Clean up on unmount
    };
  }, [insurerContract]);

  const handlePolicyAction = async (action: "edit" | "delete" | "add", policy?: Policy, policyTypeId?: number) => {
    if (action === "edit" && policy) {
      setEditedPolicy({ ...policy });
    }
    if (action === "delete" && insurerContract && policyTypeId) {
      const tx = await insurerContract.deletePolicy(policyTypeId);
      await tx.wait();
    }
    if (action === "add") {
      setAddPolicy(true);
    }
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
          {/* <FilterDropdown options={filterOptions} selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} /> */}
          <Button type="primary" onClick={() => handlePolicyAction("add")}>
            Add Policy
          </Button>
        </div>
      </div>

      <Paragraph>Current Policies</Paragraph>
      <Row gutter={[24, 24]} justify="start">
        {displayPolicies.map(
          (policy, index) =>
            policy.status !== PolicyStatus.Discontinued && (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card title={`Policy #${index + 1}`} bordered>
                  <p>
                    <strong>Premium:</strong> <DollarOutlined /> {policy.premium} ETH
                  </p>
                  <p>
                    <strong>Payout Amount:</strong> <DollarOutlined /> {policy.maxPayout} ETH
                  </p>
                  <p>
                    <strong>Delay Payout:</strong> <DollarOutlined /> {policy.delayPayout} ETH
                  </p>
                  <p>
                    <strong>Delay Threshold:</strong> <ClockCircleOutlined /> {policy.delayThreshold} hours
                  </p>
                  <p>
                    <strong>Active Duration:</strong> <ClockCircleOutlined /> {policy.activeDuration} days
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                    <Button type="primary" onClick={() => handlePolicyAction("edit", policy)}>
                      Edit Policy
                    </Button>
                    <Button danger onClick={() => handlePolicyAction("delete", policy, index + 1)}>
                      Delete Policy
                    </Button>
                  </div>
                </Card>
              </Col>
            )
        )}
      </Row>

      <Paragraph>Deleted Policies</Paragraph>
      <Row gutter={[24, 24]} justify="start">
        {displayPolicies.map(
          (policy, index) =>
            policy.status === PolicyStatus.Discontinued && (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card title={`Policy #${index + 1}`} bordered>
                  <p>
                    <strong>Premium:</strong> <DollarOutlined /> {policy.premium} ETH
                  </p>
                  <p>
                    <strong>Payout Amount:</strong> <DollarOutlined /> {policy.maxPayout} ETH
                  </p>
                  <p>
                    <strong>Delay Payout:</strong> <DollarOutlined /> {policy.delayPayout} ETH
                  </p>
                  <p>
                    <strong>Delay Threshold:</strong> <ClockCircleOutlined /> {policy.delayThreshold} hours
                  </p>
                  <p>
                    <strong>Active Duration:</strong> <ClockCircleOutlined /> {policy.activeDuration} days
                  </p>
                </Card>
              </Col>
            )
        )}
      </Row>

      <Modal visible={!!editedPolicy} onCancel={handleCloseModal} footer={null} width={600}>
        {editedPolicy ? <AddEditPolicy selectedPolicy={editedPolicy} onClose={handleCloseModal} onUpdate={fetchPolicies} /> : <Spin tip="Loading policy details..." />}
      </Modal>

      <Modal visible={!!addPolicy} onCancel={handleCloseModal} footer={null} width={600}>
        {addPolicy ? <AddEditPolicy onClose={handleCloseModal} onUpdate={fetchPolicies} /> : <Spin tip="Loading policy details..." />}
      </Modal>
    </div>
  );
};

export default InsurerPolicies;
