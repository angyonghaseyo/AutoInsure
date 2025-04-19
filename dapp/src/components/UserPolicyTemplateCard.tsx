import { Button, Card } from "antd";
import { FlightPolicyTemplate } from "../types/FlightPolicy";
import { BaggagePolicyTemplate } from "../types/BaggagePolicy";
import { convertSecondsToDays } from "@/utils/utils";

type TemplateCardProps = {
  template: FlightPolicyTemplate | BaggagePolicyTemplate;
  type: "flight" | "baggage";
  onPurchase: () => void;
};

const UserPolicyTemplateCard = ({ template, type, onPurchase }: TemplateCardProps) => {
  const showTemplate = () => {
    if (type === "flight") {
      const tpl = template as FlightPolicyTemplate;
      return (
        <div>
          <p>{tpl.description}</p>
          <p>
            <strong>Premium:</strong> {tpl.premium} ETH
          </p>
          <p>
            <strong>Payout/Hour:</strong> {tpl.payoutPerHour} ETH / hr
          </p>
          <p>
            <strong>Max Payout:</strong> {tpl.maxTotalPayout} ETH
          </p>
          <p>
            <strong>Delay Threshold:</strong> {tpl.delayThresholdHours} hrs
          </p>
          <p>
            <strong>Coverage Duration:</strong> {convertSecondsToDays(tpl.coverageDurationSeconds)} days
          </p>
        </div>
      );
    } else {
      const tpl = template as BaggagePolicyTemplate;
      return (
        <div>
          <p>{tpl.description}</p>
          <p>
            <strong>Premium:</strong> {tpl.premium} ETH
          </p>
          <p>
            <strong>Max Total Payout:</strong> {tpl.maxTotalPayout} ETH
          </p>
          <p>
            <strong>Coverage Duration:</strong> {convertSecondsToDays(tpl.coverageDurationSeconds)} days
          </p>
        </div>
      );
    }
  };

  return (
    <Card
      title={template.name}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {showTemplate()}
      <div style={{ marginTop: "auto" }}>
        <Button type="primary" block onClick={onPurchase}>
          Purchase Policy
        </Button>
      </div>
    </Card>
  );
};

export default UserPolicyTemplateCard;
