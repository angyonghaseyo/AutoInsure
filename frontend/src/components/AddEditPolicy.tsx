import React, { useState } from "react";
import { ethers } from "ethers";
import { Card, Form, Input, Button, DatePicker, TimePicker, Alert, Spin, InputNumber } from "antd";
import { DollarOutlined, CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useWeb3 } from "./Web3Provider";
import { Policy } from "../services/flightInsurance";

interface AddEditPolicyProps {
  selectedPolicy?: Policy | null;
  onClose: () => void;
  onUpdate: () => void;
}

const AddEditPolicy: React.FC<AddEditPolicyProps> = ({ selectedPolicy, onClose, onUpdate }) => {
  const { insurerContract, account } = useWeb3();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAdd = async (values: { premium: number; delayPayout: number; maxPayout: number; delayThreshold: number; activeDuration: number }) => {
    if (!insurerContract || !account) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      console.log(values.premium, values.delayPayout, values.maxPayout, values.delayThreshold, values.activeDuration);
      const tx = await insurerContract.addPolicy(values.premium, values.delayPayout, values.maxPayout, values.delayThreshold, values.activeDuration);

      await tx.wait();

      insurerContract.on("PolicyAdded", (policyTypeId: any) => {
        console.log("successfully added!");
        setSuccess(`Successfully added flight insurance policy with ID: ${policyTypeId}`);
      });

      onClose();
      onUpdate();
      form.resetFields();
    } catch (err: any) {
      console.error("Error adding policy:", err);
      setError("An error occurred while adding the policy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={selectedPolicy ? `Edit Policy` : `Add Policy`} bordered>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={handleAdd}>
        <Form.Item name="premium" label="Premium" rules={[{ required: true, message: "Please enter the premium" }]}>
          <InputNumber placeholder="e.g., 1" addonAfter="ETH" />
        </Form.Item>

        <Form.Item name="delayPayout" label="Delay Payout" rules={[{ required: true, message: "Please enter the delay payout " }]}>
          <InputNumber placeholder="e.g., 10" addonAfter="ETH" />
        </Form.Item>

        <Form.Item name="maxPayout" label="Maximum Payout" rules={[{ required: true, message: "Please enter the max payout" }]}>
          <InputNumber placeholder="e.g., 100" addonAfter="ETH" />
        </Form.Item>

        <Form.Item name="delayThreshold" label="Delay Threshold" rules={[{ required: true, message: "Please enter the delay threshold" }]}>
          <InputNumber placeholder="e.g., 100" addonAfter="hours" />
        </Form.Item>

        <Form.Item name="activeDuration" label="Active Duration" rules={[{ required: true, message: "Please enter the active duration" }]}>
          <InputNumber placeholder="e.g., 100" addonAfter="days" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Add Policy
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddEditPolicy;
