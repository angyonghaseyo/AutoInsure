import { useState } from "react";
import { Card, Form, Input, InputNumber, Button, Alert } from "antd";
import { useFlightInsurance } from "../services/flightInsurance";
import { useBaggageInsurance } from "../services/baggageInsurance";
import { FlightPolicyTemplate } from "../types/FlightPolicy";
import { BaggagePolicyTemplate } from "../types/BaggagePolicy";

/**
 * Props for EditPolicyTemplate component.
 * onClose: callback to close modal or drawer
 * onUpdate: callback to refresh the template list after editing
 */
interface EditPolicyTemplateProps {
  policyTemplate: FlightPolicyTemplate | BaggagePolicyTemplate;
  type: "flight" | "baggage";
  onClose: () => void;
  onUpdate: () => void;
}

const EditPolicyTemplate = ({ policyTemplate, type, onClose, onUpdate }: EditPolicyTemplateProps) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { editFlightPolicyTemplate } = useFlightInsurance();
  const { editBaggagePolicyTemplate } = useBaggageInsurance();

  /**
   * Submits the policy template form and updates the existing policy template on-chain.
   */
  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (type === "flight") {
        await editFlightPolicyTemplate(
          policyTemplate.templateId,
          values.name,
          values.description,
          values.premium,
          values.payoutPerHour,
          values.maxTotalPayout,
          values.delayThresholdHours,
          values.coverageDurationDays
        );
      } else if (type === "baggage") {
        await editBaggagePolicyTemplate(
          policyTemplate.templateId,
          values.name,
          values.description,
          values.premium,
          values.payoutIfDelayed,
          values.payoutIfLost,
          values.maxTotalPayout,
          values.coverageDurationDays
        );
      }

      setSuccess(`${type === "flight" ? "Flight" : "Baggage"} template successfully edited!`);
      onClose();
      onUpdate();
      form.resetFields();
    } catch (err) {
      console.error("Error editing template:", err);
      setError(`An error occurred while editing the ${type} policy template.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Conditional fields for flight or baggage templates
  const flightFields = (
    <>
      <Form.Item name="payoutPerHour" label="Payout Per Hour of Delay" rules={[{ required: true }]}>
        <InputNumber min={0} addonAfter="ETH/hr" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="delayThresholdHours" label="Delay Threshold" rules={[{ required: true }]}>
        <InputNumber min={0} addonAfter="hrs" style={{ width: "100%" }} />
      </Form.Item>
    </>
  );

  const baggageFields = (
    <>
      <Form.Item name="payoutIfDelayed" label="Payout If Delayed" rules={[{ required: true }]}>
        <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="payoutIfLost" label="Payout If Lost" rules={[{ required: true }]}>
        <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
      </Form.Item>
    </>
  );

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

        {/* Conditional Fields Based on Policy Type */}
        {type === "flight" ? flightFields : baggageFields}

        <Form.Item name="maxTotalPayout" label="Maximum Total Payout" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
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
