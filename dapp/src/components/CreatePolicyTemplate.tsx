import { useState } from "react";
import { Card, Form, Input, InputNumber, Button, Alert } from "antd";
import { useFlightInsurance } from "@/services/flightInsurance";
import { useBaggageInsurance } from "@/services/baggageInsurance";
import { convertDaysToSeconds } from "@/utils/utils";

interface CreatePolicyTemplateProps {
  onClose: () => void;
  onUpdate: () => void;
  type: "flight" | "baggage";
}

const CreatePolicyTemplate = ({ onClose, onUpdate, type }: CreatePolicyTemplateProps) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { createFlightPolicyTemplate } = useFlightInsurance();
  const { createBaggagePolicyTemplate } = useBaggageInsurance();

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { name, description, premium, maxTotalPayout, coverageDurationDays } = values;
      const durationSeconds = convertDaysToSeconds(coverageDurationDays);

      if (type === "flight") {
        const { payoutPerHour, delayThresholdHours } = values;
        await createFlightPolicyTemplate(name, description, premium, payoutPerHour, maxTotalPayout, delayThresholdHours, durationSeconds);
      }

      if (type === "baggage") {
        await createBaggagePolicyTemplate(name, description, premium, maxTotalPayout, durationSeconds);
      }

      setSuccess("Template successfully added!");
      onClose();
      onUpdate();
      form.resetFields();
    } catch (err) {
      console.error("Error creating template:", err);
      setError(`An error occurred while adding the ${type} policy template.`);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <Card title={`Add new ${type} policy template`}>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} />}

      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Form.Item name="name" label="Template Name" rules={[{ required: true, message: "Please enter a name for the policy" }]}>
          <Input placeholder="e.g. Economy Flight Cover" />
        </Form.Item>

        <Form.Item name="description" label="Description" rules={[{ required: true, message: "Please provide a description" }]}>
          <Input.TextArea rows={3} placeholder="Brief explanation of the policy template" />
        </Form.Item>

        <Form.Item name="premium" label="Premium" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
        </Form.Item>

        {type === "flight" && (
          <Form.Item name="payoutPerHour" label="Payout Per Hour of Delay" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="ETH/hr" style={{ width: "100%" }} />
          </Form.Item>
        )}

        <Form.Item name="maxTotalPayout" label="Maximum Total Payout" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
        </Form.Item>

        {type === "flight" && (
          <Form.Item name="delayThresholdHours" label="Delay Threshold" rules={[{ required: true }]}>
            <InputNumber min={0} addonAfter="hrs" style={{ width: "100%" }} />
          </Form.Item>
        )}

        <Form.Item name="coverageDurationDays" label="Coverage Duration" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="days" style={{ width: "100%" }} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Add {type} template
        </Button>
      </Form>
    </Card>
  );
};

export default CreatePolicyTemplate;
