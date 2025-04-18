import { Button, Card } from "antd";
import { DollarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { FlightPolicyTemplate } from "../types/FlightPolicy";
import { BaggagePolicyTemplate } from "../types/BaggagePolicy";
import { convertSecondsToDays } from "@/utils/utils";

type TemplateCardProps = {
  template: FlightPolicyTemplate | BaggagePolicyTemplate;
  type: "flight" | "baggage";
  onPurchase: () => void;
};

const UserPolicyTemplateCard = ({ template, type, onPurchase }: TemplateCardProps) => {
  const showTemplate = (template: FlightPolicyTemplate | BaggagePolicyTemplate) => {
    if (type === "flight") {
      const tpl = template as FlightPolicyTemplate;
      return (
        <div>
          <p>{template.description}</p>
          <p>
            <strong>Premium:</strong> <DollarOutlined /> {tpl.premium} ETH
          </p>
          <p>
            <strong>Payout/Hour:</strong> <DollarOutlined /> {tpl.payoutPerHour} ETH
          </p>
          <p>
            <strong>Max Payout:</strong> {tpl.maxTotalPayout} ETH
          </p>
          <p>
            <strong>Delay Threshold:</strong> <ClockCircleOutlined /> {tpl.delayThresholdHours} hrs
          </p>
          <p>
            <strong>Coverage Duration:</strong> {convertSecondsToDays(tpl.coverageDurationSeconds).toPrecision(1)} days
          </p>
        </div>
      );
    } else if (type === "baggage") {
      const tpl = template as BaggagePolicyTemplate;
      return (
        <div>
          <p>{tpl.description}</p>
          <p>
            <strong>Premium:</strong> <DollarOutlined /> {tpl.premium} ETH
          </p>
          <p>
            <strong>Payout If Delayed:</strong> <DollarOutlined /> {tpl.payoutIfDelayed} ETH
          </p>
          <p>
            <strong>Payout If Lost:</strong> {tpl.payoutIfLost} ETH
          </p>
          <p>
            <strong>Max Total Payout:</strong> <ClockCircleOutlined /> {tpl.maxTotalPayout} ETH
          </p>
          <p>
            <strong>Coverage Duration:</strong> {convertSecondsToDays(tpl.coverageDurationSeconds).toPrecision(1)} days
          </p>
        </div>
      );
    }
  };

  return (
    <Card
      title={template.name}
      style={{
        minHeight: 340,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {showTemplate(template)}
      <div style={{ marginTop: "auto" }}>
        <Button type="primary" block onClick={onPurchase}>
          Purchase Policy
        </Button>
      </div>
    </Card>
  );
};

export default UserPolicyTemplateCard;
