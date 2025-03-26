import React, { useState } from "react";
import { Card, Form, InputNumber, Button, Alert } from "antd";
import { useFlightInsurance } from "@/services/flightInsurance";

interface AddEditPolicyProps {
  selectedPolicy?: any; // Reserved for future edit functionality
  onClose: () => void;
  onUpdate: () => void;
}

const AddEditPolicy = ({ selectedPolicy, onClose, onUpdate }: AddEditPolicyProps) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { createPolicyTemplate } = useFlightInsurance();

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await createPolicyTemplate(
        values.premium,
        values.delayPayout,
        values.maxPayout,
        values.delayThreshold,
        values.activeDuration
      );

      setSuccess("Template successfully added!");
      onClose();
      onUpdate();
      form.resetFields();
    } catch (err) {
      console.error(err);
      setError("An error occurred while adding the policy template.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={selectedPolicy ? "Edit Template (Coming Soon)" : "Add Policy Template"}>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} />}

      <Form layout="vertical" onFinish={handleSubmit} form={form}>
        <Form.Item
          name="premium"
          label="Premium"
          rules={[{ required: true, message: "Please enter the premium amount" }]}
        >
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="delayPayout"
          label="Delay Payout (per hour)"
          rules={[{ required: true, message: "Please enter delay payout per hour" }]}
        >
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="maxPayout"
          label="Maximum Payout"
          rules={[{ required: true, message: "Please enter the maximum payout" }]}
        >
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="delayThreshold"
          label="Delay Threshold"
          rules={[{ required: true, message: "Please enter delay threshold (hours)" }]}
        >
          <InputNumber min={0} addonAfter="hrs" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="activeDuration"
          label="Policy Duration"
          rules={[{ required: true, message: "Please enter policy duration (days)" }]}
        >
          <InputNumber min={0} addonAfter="days" style={{ width: "100%" }} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={isLoading}>
          {selectedPolicy ? "Edit Template (Disabled)" : "Add Template"}
        </Button>
      </Form>
    </Card>
  );
};

export default AddEditPolicy;
