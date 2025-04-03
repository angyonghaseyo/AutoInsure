import { useState } from "react";
import { Card, Form, Input, Button, DatePicker, TimePicker, Alert, Spin } from "antd";
import { DollarOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyTemplate } from "@/types/FlightPolicy";

interface PurchasePolicyProps {
  selectedTemplate: FlightPolicyTemplate;
  onClose: () => void;
}

const PurchasePolicy = ({ selectedTemplate, onClose }: PurchasePolicyProps) => {
  const [form] = Form.useForm();
  const { purchaseFlightPolicy } = useFlightInsurance();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /**
   * Convert date + time input into Unix timestamp
   */
  const getDepartureTimestamp = (date: any, time: any): number => {
    const dateStr = date.format("YYYY-MM-DD");
    const timeStr = time.format("HH:mm");
    return Math.floor(dayjs(`${dateStr} ${timeStr}`).valueOf() / 1000);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: any) => {
    const { flightNumber, departureDate, departureTime, fromAirport, toAirport } = values;

    if (!departureDate || !departureTime) {
      setError("Please select both departure date and time.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);

      const departureTimestamp = getDepartureTimestamp(departureDate, departureTime);

      await purchaseFlightPolicy(selectedTemplate, flightNumber, fromAirport, toAirport, departureTimestamp, selectedTemplate.premium);

      setSuccessMsg(`Policy for flight ${flightNumber} purchased successfully!`);
      form.resetFields();
    } catch (err: any) {
      console.error("❌ Purchase failed:", err);
      setError(err?.message || "An error occurred while purchasing the policy.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={`Purchase ${selectedTemplate.name}`}>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {successMsg && <Alert message={successMsg} type="success" showIcon icon={<CheckCircleOutlined />} style={{ marginBottom: 16 }} />}

      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        {/* Flight Details */}
        <Form.Item name="flightNumber" label="Flight Number" rules={[{ required: true, message: "Please enter your flight number" }]}>
          <Input placeholder="e.g. SQ322" />
        </Form.Item>

        <Form.Item name="fromAirport" label="Departure Airport (IATA Code)" rules={[{ required: true, message: "Please enter departure airport code" }]}>
          <Input placeholder="e.g. SIN" />
        </Form.Item>

        <Form.Item name="toAirport" label="Arrival Airport (IATA Code)" rules={[{ required: true, message: "Please enter arrival airport code" }]}>
          <Input placeholder="e.g. LHR" />
        </Form.Item>

        <Form.Item name="departureDate" label="Departure Date" rules={[{ required: true, message: "Please select a departure date" }]}>
          <DatePicker style={{ width: "100%" }} suffixIcon={<CalendarOutlined />} />
        </Form.Item>

        <Form.Item name="departureTime" label="Departure Time" rules={[{ required: true, message: "Please select a departure time" }]}>
          <TimePicker format="HH:mm" style={{ width: "100%" }} suffixIcon={<ClockCircleOutlined />} />
        </Form.Item>

        {/* Policy Info (readonly) */}
        <Form.Item label="Premium">
          <Input prefix={<DollarOutlined />} value={`${selectedTemplate.premium} ETH`} disabled />
        </Form.Item>

        <Form.Item label="Payout Per Hour">
          <Input prefix={<DollarOutlined />} value={`${selectedTemplate.payoutPerHour} ETH`} disabled />
        </Form.Item>

        <Form.Item label="Maximum Payout">
          <Input prefix={<DollarOutlined />} value={`${selectedTemplate.maxTotalPayout} ETH`} disabled />
        </Form.Item>

        <Form.Item label="Delay Threshold">
          <Input prefix={<ClockCircleOutlined />} value={`${selectedTemplate.delayThresholdHours} hrs`} disabled />
        </Form.Item>

        {/* Submit */}
        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Purchase Policy
        </Button>
      </Form>
    </Card>
  );
};

export default PurchasePolicy;
