import { BaggagePolicyTemplate, BaggagePolicyTemplateStatus } from "@/types/BaggagePolicy";
import { FlightPolicyTemplate, FlightPolicyTemplateStatus } from "@/types/FlightPolicy";
import { convertSecondsToDays } from "@/utils/utils";
import { DollarOutlined, ClockCircleOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Card, Tag } from "antd";

type TemplateCardProps = {
  template: FlightPolicyTemplate | BaggagePolicyTemplate;
  type: "flight" | "baggage";
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const InsurerPolicyTemplateCard = ({ template, type, onView, onDelete, onEdit }: TemplateCardProps) => {
  /**
   * Maps a policy template status to tag color.
   */
  const getStatusColor = (status: FlightPolicyTemplateStatus | BaggagePolicyTemplateStatus): string => {
    switch (status) {
      case FlightPolicyTemplateStatus.Active:
      case BaggagePolicyTemplateStatus.Active:
        return "green";
      case FlightPolicyTemplateStatus.Deactivated:
      case BaggagePolicyTemplateStatus.Deactivated:
        return "red";
      default:
        return "gray";
    }
  };

  const isDisabled = (status: FlightPolicyTemplateStatus | BaggagePolicyTemplateStatus): boolean => {
    return status === FlightPolicyTemplateStatus.Deactivated || status === BaggagePolicyTemplateStatus.Deactivated;
  };

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
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      extra={<Tag color={getStatusColor(template.status)}>{template.status === FlightPolicyTemplateStatus.Active ? "Active" : "Deactivated"}</Tag>}
    >
      {showTemplate(template)}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <Button icon={<EyeOutlined />} onClick={onView} style={{ flex: 1 }}>
          View Purchased Policies
        </Button>
        <Button onClick={onEdit} disabled={isDisabled(template.status)} style={{ flex: 1 }}>
          Edit Template
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={onDelete} disabled={isDisabled(template.status)} style={{ flex: 1 }}>
          Deactivate
        </Button>
      </div>
    </Card>
  );
};

export default InsurerPolicyTemplateCard;
