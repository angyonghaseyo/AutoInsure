import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Dropdown, Button, Statistic, Row, Col, Modal, Alert } from "antd";
import { DownOutlined, LogoutOutlined, WalletOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import DepositWithdraw from "./DepositWithdraw";
import { useWeb3, Role } from "./Web3Provider";

const WalletConnect = () => {
  const { account, isConnecting, connectWallet, disconnectWallet, provider, insurerContract, role } = useWeb3();
  const [walletBalance, setWalletBalance] = useState("0");
  const [contractBalance, setContractBalance] = useState("0");
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit");
  const [showConnectError, setShowConnectError] = useState(false);
  const router = useRouter();

  // Fetch wallet balance using ethers.js
  const fetchWalletBalance = async () => {
    if (provider && account) {
      const balance = await provider.getBalance(account);
      setWalletBalance(ethers.formatEther(balance.toString()));
    }
  };

  // Call the contract's getContractBalance function and format the result
  const fetchContractBalance = async () => {
    if (insurerContract) {
      const balance = await insurerContract.getContractBalance();
      setContractBalance(ethers.formatEther(balance));
    }
  };

  useEffect(() => {
    if (account && provider && insurerContract) {
      fetchWalletBalance();
      if (role === Role.Insurer) {
        fetchContractBalance();
      }
    }
  }, [account, provider, insurerContract, role]);

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Menu items for users and insurers
  const userMenuItems = useMemo(() => [
    {
      key: "walletStatistic",
      label: (
        <div style={{ padding: "10px", textAlign: "center", cursor: "default" }}>
          <Statistic title="Wallet Balance" value={parseFloat(walletBalance)} precision={2} suffix="ETH" />
        </div>
      ),
      disabled: true,
    },
    {
      key: "disconnect",
      label: (
        <Button
          block
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => {
            disconnectWallet();
            router.push("/");
          }}
        >
          Disconnect Wallet
        </Button>
      ),
    },
  ], [walletBalance, disconnectWallet, router]);

  const insurerMenuItems = useMemo(() => [
    {
      key: "statistics",
      label: (
        <div style={{ padding: "10px", textAlign: "center", cursor: "default" }}>
          <Row gutter={16} justify="center">
            <Col span={12}>
              <Statistic title="Wallet Balance" value={parseFloat(walletBalance)} precision={2} suffix="ETH" />
            </Col>
            <Col span={12}>
              <Statistic title="Contract Balance" value={parseFloat(contractBalance)} precision={2} suffix="ETH" />
            </Col>
          </Row>
        </div>
      ),
      disabled: true,
    },
    {
      key: "deposit",
      label: (
        <Button
          block
          type="text"
          icon={<PlusOutlined />}
          onClick={() => {
            setModalType("deposit");
            setShowDepositWithdrawModal(true);
          }}
        >
          Deposit
        </Button>
      ),
    },
    {
      key: "withdraw",
      label: (
        <Button
          block
          type="text"
          icon={<MinusOutlined />}
          onClick={() => {
            setModalType("withdraw");
            setShowDepositWithdrawModal(true);
          }}
        >
          Withdraw
        </Button>
      ),
    },
    {
      key: "disconnect",
      label: (
        <Button
          block
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => {
            disconnectWallet();
            router.push("/");
          }}
        >
          Disconnect Wallet
        </Button>
      ),
    },
  ], [walletBalance, contractBalance, disconnectWallet, router]);

  return (
    <>
      <Dropdown menu={{ items: role == Role.User ? userMenuItems : insurerMenuItems }} trigger={["click"]} open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        {account ? (
          <Button type="primary" icon={<WalletOutlined />}>
            {shortenAddress(account)} <DownOutlined />
          </Button>
        ) : (
          <>
            <Button type="primary" onClick={connectWallet} loading={isConnecting} icon={<WalletOutlined />}>
              Connect Wallet
            </Button>
            {showConnectError && (
              <Alert
                message="Connection Error"
                description="Unable to connect to your wallet. Please try again."
                type="error"
                showIcon
                className="mt-4"
              />
            )}
          </>
        )}
      </Dropdown>
      
      {/* Deposit Withdraw Modal */}
      <Modal open={showDepositWithdrawModal} onCancel={() => setShowDepositWithdrawModal(false)} footer={null} destroyOnClose>
        <DepositWithdraw
          type={modalType}
          onClose={() => setShowDepositWithdrawModal(false)}
          onUpdate={() => {
            fetchWalletBalance();
            fetchContractBalance();
          }}
          walletBalance={walletBalance}
          contractBalance={contractBalance}
        />
      </Modal>
    </>
  );
};

export default WalletConnect;
