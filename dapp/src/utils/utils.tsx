import { BaggagePolicyStatus } from "@/types/BaggagePolicy";
import { FlightPolicyStatus } from "@/types/FlightPolicy";
import { Tag } from "antd";

export const getStatusTag = (status: FlightPolicyStatus | BaggagePolicyStatus) => {
  switch (status) {
    case FlightPolicyStatus.Active | BaggagePolicyStatus.Active:
      return <Tag color="green">Active</Tag>;
    case FlightPolicyStatus.Claimed | BaggagePolicyStatus.Claimed:
      return <Tag color="blue">Claimed</Tag>;
    case FlightPolicyStatus.Expired | BaggagePolicyStatus.Expired:
      return <Tag color="orange">Expired</Tag>;
    default:
      return <Tag color="gray">Unknown</Tag>;
  }
};
