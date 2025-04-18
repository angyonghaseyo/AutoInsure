import { useState } from "react";
import { Card, Form, Input, Button, DatePicker, TimePicker, Alert } from "antd";
import { DollarOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { useFlightInsurance } from "@/services/flightInsurance";
import { FlightPolicyTemplate } from "@/types/FlightPolicy";
import { BaggagePolicyTemplate } from "@/types/BaggagePolicy";
import { useBaggageInsurance } from "@/services/baggageInsurance";
import { convertSecondsToDays } from "@/utils/utils";

interface PurchasePolicyProps {
  type: "flight" | "baggage";
  selectedTemplate: FlightPolicyTemplate | BaggagePolicyTemplate;
  onClose: () => void;
}

const PurchasePolicy = ({ type, selectedTemplate, onClose }: PurchasePolicyProps) => {
  const [form] = Form.useForm();
  const { purchaseFlightPolicy } = useFlightInsurance();
  const { purchaseBaggagePolicy } = useBaggageInsurance(); // Assuming you have a similar function for baggage policies

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
    const { flightNumber, departureDate, departureTime, fromAirport, toAirport, itemDescription } = values;

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);

      if (type === "flight") {
        if (!departureDate || !departureTime) {
          setError("Please select both departure date and time.");
          return;
        }
        const departureTimestamp = getDepartureTimestamp(departureDate, departureTime);
        const flightTemplate = selectedTemplate as FlightPolicyTemplate;
        await purchaseFlightPolicy(flightTemplate, flightNumber, fromAirport, toAirport, departureTimestamp, selectedTemplate.premium);
        setSuccessMsg(`${type} Policy "${flightTemplate.name}" purchased successfully!`);
      } else if (type === "baggage") {
        const baggageTemplate = selectedTemplate as BaggagePolicyTemplate;
        await purchaseBaggagePolicy(baggageTemplate, itemDescription, selectedTemplate.premium);
        setSuccessMsg(`${type} Policy "${baggageTemplate.name}" purchased successfully!`);
      }

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
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {successMsg && <Alert message={successMsg} type="success" showIcon icon={<CheckCircleOutlined />} style={{ marginBottom: 16 }} />}

      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        {/* Flight Details */}
        {type === "flight" && (
          <>
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
          </>
        )}

        {/* Baggage Details */}
        {type === "baggage" && (
          <Form.Item name="itemDescription" label="Item Description" rules={[{ required: true, message: "Please enter the item description" }]}>
            <Input placeholder="e.g. Rimowa Luggage" />
          </Form.Item>
        )}

        {/* Policy Info (readonly) */}
        <Form.Item label="Premium">
          <Input prefix={<DollarOutlined />} value={`${selectedTemplate.premium} ETH`} disabled />
        </Form.Item>

        <Form.Item label="Coverage Duration">
          <Input prefix={<ClockCircleOutlined />} value={`${convertSecondsToDays(selectedTemplate.coverageDurationSeconds).toPrecision(1)} days`} disabled />
        </Form.Item>

        {type === "baggage" && (
          <>
            <Form.Item label="Payout Per Hour">
              <Input prefix={<DollarOutlined />} value={`${(selectedTemplate as BaggagePolicyTemplate).payoutIfDelayed} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Delay Threshold">
              <Input prefix={<ClockCircleOutlined />} value={`${(selectedTemplate as BaggagePolicyTemplate).payoutIfLost} hrs`} disabled />
            </Form.Item>
          </>
        )}

        {type === "flight" && (
          <>
            <Form.Item label="Payout Per Hour">
              <Input prefix={<DollarOutlined />} value={`${(selectedTemplate as FlightPolicyTemplate).payoutPerHour} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Delay Threshold">
              <Input prefix={<ClockCircleOutlined />} value={`${(selectedTemplate as FlightPolicyTemplate).delayThresholdHours} hrs`} disabled />
            </Form.Item>
          </>
        )}

        {/* Submit */}
        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Purchase Policy
        </Button>
      </Form>
    </Card>
  );
};

export default PurchasePolicy;
