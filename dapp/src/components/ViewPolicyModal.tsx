import { BaggageUserPolicy } from "@/types/BaggagePolicy";
import { FlightUserPolicy } from "@/types/FlightPolicy";
import { convertSecondsToDays, getStatusTag } from "@/utils/utils";
import { Card, Modal, Spin } from "antd";

type ViewPolicyModalProps = {
  type: "flight" | "baggage";
  policy: FlightUserPolicy | BaggageUserPolicy | undefined;
  onCancel: () => void;
};

export const ViewPolicyModal = ({ type, policy, onCancel }: ViewPolicyModalProps) => {
  return (
    <>
      {/* Optional Modal to show more details (can link to ViewPolicy component) */}
      <Modal title={`${policy?.template.name}`} open={!!policy} onCancel={onCancel} footer={null} destroyOnClose>
        <Card>
          {policy ? (
            type === "flight" ? (
              <div>
                <p>
                  <strong>Policy ID:</strong> {(policy as FlightUserPolicy).policyId}
                </p>
                <p>
                  <strong>Flight:</strong> {(policy as FlightUserPolicy).flightNumber}
                </p>
                <p>
                  <strong>From:</strong> {(policy as FlightUserPolicy).departureAirportCode}
                </p>
                <p>
                  <strong>To:</strong> {(policy as FlightUserPolicy).arrivalAirportCode}
                </p>
                <p>
                  <strong>Departure Time:</strong> {new Date((policy as FlightUserPolicy).departureTime * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Date of Purchase:</strong> {new Date((policy as FlightUserPolicy).createdAt * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Policy Premium:</strong> {(policy as FlightUserPolicy).template.premium} ETH
                </p>
                <p>
                  <strong>Policy Description:</strong> {(policy as FlightUserPolicy).template.description}
                </p>
                <p>
                  <strong>Policy Max Total Payout:</strong> {(policy as FlightUserPolicy).template.maxTotalPayout} ETH
                </p>
                <p>
                  <strong>Policy Payout Per Hour:</strong> {(policy as FlightUserPolicy).template.payoutPerHour} ETH/hr
                </p>
                <p>
                  <strong>Policy Delay Threshold:</strong> {(policy as FlightUserPolicy).template.delayThresholdHours} hours
                </p>
                <p>
                  <strong>Policy Coverage Duration:</strong> {convertSecondsToDays((policy as FlightUserPolicy).template.coverageDurationSeconds).toPrecision(1)} days
                </p>
                <p>
                  <strong>Status:</strong> {getStatusTag((policy as FlightUserPolicy).status)}
                </p>
              </div>
            ) : (
              type === "baggage" && (
                <div>
                  <p>
                    <strong>Policy ID:</strong> {(policy as BaggageUserPolicy).policyId}
                  </p>
                  <p>
                    <strong>Date of Purchase:</strong> {new Date((policy as BaggageUserPolicy).createdAt * 1000).toLocaleString()}
                  </p>
                  <p>
                    <strong>Item Description:</strong> {(policy as BaggageUserPolicy).itemDescription}
                  </p>
                  <p>
                    <strong>Payout to Date:</strong> {(policy as BaggageUserPolicy).payoutToDate} ETH
                  </p>
                  <p>
                    <strong>Policy Premium:</strong> {(policy as BaggageUserPolicy).template.premium} ETH
                  </p>
                  <p>
                    <strong>Policy Description:</strong> {(policy as BaggageUserPolicy).template.description}
                  </p>
                  <p>
                    <strong>Policy Max Total Payout:</strong> {(policy as BaggageUserPolicy).template.maxTotalPayout} ETH
                  </p>
                  <p>
                    <strong>Policy payout if delayed:</strong> {(policy as BaggageUserPolicy).template.payoutIfDelayed} ETH
                  </p>
                  <p>
                    <strong>Policy payout if lost:</strong> {(policy as BaggageUserPolicy).template.payoutIfLost} ETH
                  </p>
                  <p>
                    <strong>Policy coverage duration:</strong> {convertSecondsToDays((policy as BaggageUserPolicy).template.coverageDurationSeconds).toPrecision(1)} days
                  </p>
                  <p>
                    <strong>Status:</strong> {getStatusTag((policy as BaggageUserPolicy).status)}
                  </p>
                </div>
              )
            )
          ) : (
            <Spin />
          )}
        </Card>
      </Modal>
    </>
  );
};
