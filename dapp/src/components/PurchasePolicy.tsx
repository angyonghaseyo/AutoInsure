import { useState } from "react";
import { Card, Form, Input, Button, DatePicker, TimePicker, message } from "antd";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useFlightInsurance } from "../services/flightInsurance";
import { useBaggageInsurance } from "../services/baggageInsurance";
import { FlightPolicyTemplate } from "../types/FlightPolicy";
import { BaggagePolicyTemplate } from "../types/BaggagePolicy";
import { convertSecondsToDays } from "@/utils/utils";

dayjs.extend(utc);

interface PurchasePolicyProps {
  type: "flight" | "baggage";
  selectedTemplate: FlightPolicyTemplate | BaggagePolicyTemplate;
  onClose: () => void;
}

const PurchasePolicy = ({ type, selectedTemplate, onClose }: PurchasePolicyProps) => {
  const [form] = Form.useForm();
  const { purchaseFlightPolicy } = useFlightInsurance();
  const { purchaseBaggagePolicy } = useBaggageInsurance();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDepartureTimestamp = (date: any, time: any): number => {
    const dateStr = date.format("YYYY-MM-DD");
    const timeStr = time.format("HH:mm");
    return Math.floor(dayjs(`${dateStr} ${timeStr}`).utc().valueOf() / 1000);
  };

  const handleSubmit = async (values: any) => {
    const { flightNumber, departureDate, departureTime, itemDescription } = values;

    try {
      setIsLoading(true);
      setError(null);

      if (!departureDate || !departureTime) {
        setError("Please select both departure date and time.");
        return;
      }

      const departureTimestamp = getDepartureTimestamp(departureDate, departureTime);

      if (type === "flight") {
        const template = selectedTemplate as FlightPolicyTemplate;
        await purchaseFlightPolicy(template, flightNumber, departureTimestamp, template.premium);
        message.success(`Flight Policy "${template.name}" purchased successfully!`);
      } else if (type === "baggage") {
        const template = selectedTemplate as BaggagePolicyTemplate;
        await purchaseBaggagePolicy(template, flightNumber, departureTimestamp, itemDescription, template.premium);
        message.success(`Baggage Policy "${template.name}" purchased successfully!`);
      }

      onClose();
      form.resetFields();
    } catch (err: any) {
      console.error("Purchase failed:", err);
      setError(err?.message || "An error occurred while purchasing the policy.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={`Purchase ${selectedTemplate.name}`}>
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        {/* Common flight details for both types */}
        <Form.Item name="flightNumber" label="Flight Number" rules={[{ required: true, message: "Please enter your flight number" }]}>
          <Input placeholder="e.g. SQ322" />
        </Form.Item>

        <Form.Item name="departureDate" label="Departure Date" rules={[{ required: true, message: "Please select a departure date" }]}>
          <DatePicker style={{ width: "100%" }} suffixIcon={<CalendarOutlined />} />
        </Form.Item>

        <Form.Item name="departureTime" label="Departure Time" rules={[{ required: true, message: "Please select a departure time" }]}>
          <TimePicker format="HH:mm" style={{ width: "100%" }} suffixIcon={<ClockCircleOutlined />} />
        </Form.Item>

        {/* Baggage-specific field */}
        {type === "baggage" && (
          <Form.Item name="itemDescription" label="Item Description" rules={[{ required: true, message: "Please enter the item description" }]}>
            <Input placeholder="e.g. Rimowa Luggage" />
          </Form.Item>
        )}

        {/* Read-only display */}
        <Form.Item label="Premium">
          <Input value={`${selectedTemplate.premium} ETH`} disabled />
        </Form.Item>

        {type === "flight" && (
          <Form.Item label="Payout Per Hour">
            <Input value={`${(selectedTemplate as FlightPolicyTemplate).payoutPerHour} ETH / hr`} disabled />
          </Form.Item>
        )}

        <Form.Item label="Max Total Payout">
          <Input value={`${selectedTemplate.maxTotalPayout} ETH`} disabled />
        </Form.Item>

        {type === "flight" && (
          <Form.Item label="Delay Threshold">
            <Input value={`${(selectedTemplate as FlightPolicyTemplate).delayThresholdHours} hrs`} disabled />
          </Form.Item>
        )}

        <Form.Item label="Coverage Duration">
          <Input value={`${convertSecondsToDays(selectedTemplate.coverageDurationSeconds)} days`} disabled />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Purchase Policy
        </Button>
      </Form>
    </Card>
  );
};

export default PurchasePolicy;
