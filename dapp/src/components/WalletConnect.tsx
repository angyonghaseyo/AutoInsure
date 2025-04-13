import React, { useEffect, useState } from "react";
import { Dropdown, Button, Space, Statistic, Row, Col, Modal } from "antd";
import { useWeb3, Role } from "./Web3Provider";
import { ethers } from "ethers";
import { DownOutlined, LogoutOutlined, LinkOutlined, WalletOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import DepositWithdraw from "./DepositWithdraw";
import { useRouter } from "next/router";

const WalletConnect: React.FC = () => {
  const { account, chainId, isConnecting, connectWallet, disconnectWallet, network, provider, insurerContract, role } = useWeb3();
  const [walletBalance, setWalletBalance] = useState("0");
  const [contractBalance, setContractBalance] = useState("0");
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit");

  // Fetch wallet balance using ethers.js
  const fetchWalletBalance = async () => {
    if (provider && account) {
      const balance = await provider.getBalance(account);
      setWalletBalance(ethers.formatEther(balance));
      console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
    }
  };

  // Call the contract's getContractBalance function and format the result
  const fetchContractBalance = async () => {
    if (insurerContract) {
      const balance = await insurerContract.getContractBalance();
      setContractBalance(ethers.formatEther(balance));
      console.log(`Contract balance: ${ethers.formatEther(balance)} ETH`);
    }
  };

  useEffect(() => {
    if (account && provider && insurerContract) {
      fetchWalletBalance();
      if (role === Role.Insurer) {
        fetchContractBalance();
      }
    }
  }, [account, insurerContract, provider]);

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const userMenuItems = [
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
  ];

  const insurerMenuItems = [
    {
      key: "statistics",
      label: (
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
  ];

  return (
    <>
      <Dropdown menu={{ items: role == Role.User ? userMenuItems : insurerMenuItems }} trigger={["click"]} open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        {account ? (
          <Button type="primary" icon={<WalletOutlined />}>
            {shortenAddress(account)} <DownOutlined />
          </Button>
        ) : (
          <Button type="primary" onClick={connectWallet} loading={isConnecting} icon={<WalletOutlined />}>
            Connect Wallet
          </Button>
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
