import { useState } from "react";
import { Card, Form, Input, InputNumber, Button, Alert } from "antd";
import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyTemplate } from "@/types/FlightPolicy";

/**
 * Props for CreatePolicyTemplate component.
 * onClose: callback to close modal or drawer
 * onUpdate: callback to refresh the template list after creation
 */
interface CreatePolicyTemplateProps {
  policyTemplate: FlightPolicyTemplate;
  onClose: () => void;
  onUpdate: () => void;
}

const EditPolicyTemplate = ({ policyTemplate, onClose, onUpdate }: CreatePolicyTemplateProps) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { editFlightPolicyTemplate } = useFlightInsurance();

  /**
   * Submits the policy template form and creates a new policy template on-chain.
   */
  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await editFlightPolicyTemplate(
        policyTemplate.templateId,
        values.name,
        values.description,
        values.premium,
        values.payoutPerHour,
        values.delayThresholdHours,
        values.maxTotalPayout,
        values.coverageDurationDays
      );

      setSuccess("Template successfully edited!");
      onClose();
      onUpdate();
      form.resetFields();
    } catch (err) {
      console.error("Error editing template:", err);
      setError("An error occurred while editing the policy template.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={`Edit ${policyTemplate.name}`}>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} />}

      <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={policyTemplate}>
        <Form.Item name="name" label="Template Name" rules={[{ required: true, message: "Please enter a name for the policy" }]}>
          <Input placeholder="e.g. Economy Flight Cover" />
        </Form.Item>

        <Form.Item name="description" label="Description" rules={[{ required: true, message: "Please provide a description" }]}>
          <Input.TextArea rows={3} placeholder="Brief explanation of the policy template" />
        </Form.Item>

        <Form.Item name="premium" label="Premium" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="payoutPerHour" label="Payout Per Hour of Delay" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="ETH/hr" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="maxTotalPayout" label="Maximum Total Payout" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="delayThresholdHours" label="Delay Threshold" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="hrs" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="coverageDurationDays" label="Coverage Duration" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="days" style={{ width: "100%" }} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Confirm Edit
        </Button>
      </Form>
    </Card>
  );
};

export default EditPolicyTemplate;
