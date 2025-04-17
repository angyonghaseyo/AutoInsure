import { useState } from "react";
import { Card, Form, Input, Button, DatePicker, TimePicker, message } from "antd";
import { DollarOutlined, CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useFlightInsurance } from "../services/flightInsurance";
import { useBaggageInsurance } from "../services/baggageInsurance";
import { FlightPolicyTemplate } from "../types/FlightPolicy";
import { BaggagePolicyTemplate } from "../types/BaggagePolicy";

// Extend dayjs to use the UTC plugin
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

  /**
   * Convert date + time input into Unix timestamp in UTC
   */
  const getDepartureTimestamp = (date: any, time: any): number => {
    const dateStr = date.format("YYYY-MM-DD");
    const timeStr = time.format("HH:mm");
    return Math.floor(dayjs(`${dateStr} ${timeStr}`).utc().valueOf() / 1000);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: any) => {
    const { flightNumber, departureDate, departureTime, fromAirport, toAirport, itemDescription } = values;

    try {
      setIsLoading(true);
      setError(null);

      if (type === "flight") {
        if (!departureDate || !departureTime) {
          setError("Please select both departure date and time.");
          return;
        }
        const departureTimestamp = getDepartureTimestamp(departureDate, departureTime);
        const flightTemplate = selectedTemplate as FlightPolicyTemplate;
        await purchaseFlightPolicy(flightTemplate, flightNumber, fromAirport, toAirport, departureTimestamp, selectedTemplate.premium);

        message.success(`${type} Policy "${flightTemplate.name}" purchased successfully!`);
        onClose();
      } else if (type === "baggage") {
        const baggageTemplate = selectedTemplate as BaggagePolicyTemplate;
        await purchaseBaggagePolicy(baggageTemplate, itemDescription, selectedTemplate.premium);
        
        message.success(`${type} Policy "${baggageTemplate.name}" purchased successfully!`);
        onClose();
      }

      form.resetFields();
    } catch (err: any) {
      console.error("❌ Purchase failed:", err);
      message.error(err?.message || "An error occurred while purchasing the policy.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={`Purchase ${selectedTemplate.name}`}>
      {/* Flight and Baggage Purchase Form */}
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
        {type === "baggage" && (
          <>
            <Form.Item label="Premium">
              <Input prefix={<DollarOutlined />} value={`${selectedTemplate.premium} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Payout If Delayed">
              <Input prefix={<DollarOutlined />} value={`${(selectedTemplate as BaggagePolicyTemplate).payoutIfDelayed} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Payout If Lost">
              <Input prefix={<DollarOutlined />} value={`${(selectedTemplate as BaggagePolicyTemplate).payoutIfLost} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Max Total Payout">
              <Input prefix={<DollarOutlined />} value={`${(selectedTemplate as BaggagePolicyTemplate).maxTotalPayout} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Coverage Duration">
              <Input prefix={<ClockCircleOutlined />} value={`${(selectedTemplate as BaggagePolicyTemplate).coverageDurationDays} days`} disabled />
            </Form.Item>
          </>
        )}

        {type === "flight" && (
          <>
            <Form.Item label="Premium">
              <Input prefix={<DollarOutlined />} value={`${selectedTemplate.premium} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Payout Per Hour">
              <Input prefix={<DollarOutlined />} value={`${(selectedTemplate as FlightPolicyTemplate).payoutPerHour} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Max Total Payout">
              <Input prefix={<DollarOutlined />} value={`${(selectedTemplate as FlightPolicyTemplate).maxTotalPayout} ETH`} disabled />
            </Form.Item>

            <Form.Item label="Delay Threshold">
              <Input prefix={<ClockCircleOutlined />} value={`${(selectedTemplate as FlightPolicyTemplate).delayThresholdHours} hrs`} disabled />
            </Form.Item>

            <Form.Item label="Coverage Duration">
              <Input prefix={<ClockCircleOutlined />} value={`${(selectedTemplate as FlightPolicyTemplate).coverageDurationDays} days`} disabled />
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
