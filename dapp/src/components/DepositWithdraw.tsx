import React, { useState } from "react";
import { Card, Form, InputNumber, Button, Alert, Row, Col, Statistic } from "antd";
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

  // Function to deposit funds
  const depositFunds = async (amount: string) => {
    if (insurerContract) {
      const weiAmount = ethers.parseEther(amount);
      const tx = await insurerContract.deposit({ value: weiAmount });
      await tx.wait();
    }
  };

  // Function to withdraw funds
  const withdrawFunds = async (amount: string) => {
    if (insurerContract) {
      const weiAmount = ethers.parseEther(amount);
      const tx = await insurerContract.withdraw(weiAmount);
      await tx.wait();
    }
  };

  // Submit form handler
  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amount = values.amount.toString();

      if (type === "deposit") {
        await depositFunds(amount);
        setSuccess("Deposit successful!");
      } else {
        await withdrawFunds(amount);
        setSuccess("Withdrawal successful!");
      }

      onUpdate();
      onClose();
      form.resetFields();
    } catch (err) {
      setError(`Error ${type === "deposit" ? "depositing" : "withdrawing"} funds.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={type === "deposit" ? "Deposit Funds" : "Withdraw Funds"}>
      {/* Error and Success Messages */}
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 16 }} />}

      {/* Wallet and Contract Balances */}
      <Row gutter={16} justify="center" style={{ marginBottom: 16 }}>
        <Col span={12} style={{ textAlign: "center" }}>
          <Statistic title="Wallet Balance" value={parseFloat(walletBalance)} precision={2} suffix="ETH" />
        </Col>
        <Col span={12} style={{ textAlign: "center" }}>
          <Statistic title="Contract Balance" value={parseFloat(contractBalance)} precision={2} suffix="ETH" />
        </Col>
      </Row>

      {/* Form for Deposit/Withdraw */}
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Form.Item
          name="amount"
          label="Amount"
          rules={[
            { required: true, message: "Please enter the amount" },
            { type: "number", min: 0, message: "Amount must be greater than 0" },
          ]}
        >
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
