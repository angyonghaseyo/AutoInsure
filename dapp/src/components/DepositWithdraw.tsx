import { useState } from "react";
import { Card, Form, Input, InputNumber, Button, Alert, Row, Col, Statistic } from "antd";
import { useWeb3 } from "./Web3Provider";
import { ethers } from "ethers";

/**
 * Props for DepositWithdraw component.
 * onClose: callback to close modal or drawer
 * onUpdate: callback to refresh the template list after deposit/withdraw
 */
interface DepositWithdrawProps {
  type: "deposit" | "withdraw";
  onClose: () => void;
  onUpdate: () => void;
  contractBalance: string;
  walletBalance: string;
}

const DepositWithdraw = ({ type, onClose, onUpdate, contractBalance, walletBalance }: DepositWithdrawProps) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { insurerContract } = useWeb3();

  const depositFunds = async (depositAmount: string) => {
    if (insurerContract && depositAmount) {
      const weiAmount = ethers.parseEther(depositAmount);
      const tx = await insurerContract.deposit({ value: weiAmount });
      await tx.wait();
    }
  };

  const withdrawFunds = async (withdrawAmount: string) => {
    if (insurerContract && withdrawAmount) {
      const weiAmount = ethers.parseEther(withdrawAmount);
      const tx = await insurerContract.withdraw(weiAmount);
      await tx.wait();
    }
  };

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (type === "deposit") {
        await depositFunds(values.amount.toString());
        setSuccess("Successfully deposited!");
      } else {
        await withdrawFunds(values.amount.toString());
        setSuccess("Successfully withdrawn!");
      }
      onUpdate();
      onClose();
      form.resetFields();
    } catch (err) {
      if (type === "deposit") {
        console.error("Error withdrawing:", err);
        setError("An error occurred while depositing.");
      } else {
        console.error("Error withdrawing:", err);
        setError("An error occurred while withdrawing.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={type == "deposit" ? "Deposit" : "Withdraw"}>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} />}
      <div style={{ padding: "10px", textAlign: "center", cursor: "default" }}>
        {/* Statistics Row */}
        <Row gutter={16} justify="center">
          <Col span={12} style={{ textAlign: "center" }}>
            <Statistic title="Wallet Balance" value={parseFloat(walletBalance)} precision={2} suffix="ETH" />
          </Col>
          <Col span={12} style={{ textAlign: "center" }}>
            <Statistic title="Contract Balance" value={parseFloat(contractBalance)} precision={2} suffix="ETH" />
          </Col>
        </Row>
      </div>
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
          <InputNumber min={0} addonAfter="ETH" style={{ width: "100%" }} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={isLoading}>
          {type == "deposit" ? "Confirm Deposit" : "Confirm Withdraw"}
        </Button>
      </Form>
    </Card>
  );
};

export default DepositWithdraw;
