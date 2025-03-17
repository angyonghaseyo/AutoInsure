import React, { useState } from "react";
import { ethers } from "ethers";
import { Card, Form, Input, Button, DatePicker, TimePicker, Alert, Spin } from "antd";
import { DollarOutlined, CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useWeb3 } from "./Web3Provider";
import { Policy } from "../services/flightInsurance";

interface AddEditPolicyProps {
  selectedPolicy: Policy | null;
  onClose: () => void;
}

const AddEditPolicy: React.FC<AddEditPolicyProps> = ({ selectedPolicy, onClose }) => {
  const { flightInsuranceContract, account } = useWeb3();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!selectedPolicy) {
    return <Spin tip="Loading policy details..." />;
  }

  const handlePurchase = async (values: any) => {
    if (!flightInsuranceContract || !account) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const { flightNumber, departureDate, departureTime } = values;
      const departureTimestamp = Math.floor(new Date(departureDate.format("YYYY-MM-DD") + " " + departureTime.format("HH:mm")).getTime() / 1000);

      const premiumWei = ethers.parseEther(selectedPolicy.premium);
      const tx = await flightInsuranceContract.purchasePolicy(flightNumber, departureTimestamp, { value: premiumWei });

      await tx.wait();
      setSuccess(`Successfully purchased policy for flight ${flightNumber}`);
      form.resetFields();
    } catch (err: any) {
      console.error("Error purchasing policy:", err);
      setError(err.message || "An error occurred while purchasing the policy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={`Purchase ${selectedPolicy.name}`} bordered>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={handlePurchase}>
        <Form.Item name="flightNumber" label="Flight Number" rules={[{ required: true, message: "Please enter your flight number" }]}>
          <Input placeholder="e.g., AA123" />
        </Form.Item>

        <Form.Item name="departureDate" label="Departure Date" rules={[{ required: true, message: "Please select your departure date" }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="departureTime" label="Departure Time" rules={[{ required: true, message: "Please select your departure time" }]}>
          <TimePicker format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Premium">
          <Input prefix={<DollarOutlined />} value={selectedPolicy.premium} disabled />
        </Form.Item>

        <Form.Item label="Payout Amount">
          <Input prefix={<DollarOutlined />} value={selectedPolicy.payoutAmount} disabled />
        </Form.Item>

        <Form.Item label="Delay Threshold">
          <Input prefix={<ClockCircleOutlined />} value={`${selectedPolicy.delayThreshold} min`} disabled />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Purchase Policy
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddEditPolicy;
