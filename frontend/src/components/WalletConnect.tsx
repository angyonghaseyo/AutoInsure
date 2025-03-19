import React, { useState } from 'react';
import { Dropdown, Button } from 'antd';
import { useWeb3 } from './Web3Provider';
import { DownOutlined, LogoutOutlined, LinkOutlined, WalletOutlined } from '@ant-design/icons';

const WalletConnect: React.FC = () => {
  const { account, chainId, isConnecting, connectWallet, disconnectWallet, network } = useWeb3();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const menuItems = [
    {
      key: 'view',
      label: (
        <a href={`https://etherscan.io/address/${account}`} target="_blank" rel="noopener noreferrer">
          <LinkOutlined /> View on Etherscan
        </a>
      ),
    },
    {
      key: 'disconnect',
      label: (
        <Button type="text" icon={<LogoutOutlined />} onClick={disconnectWallet}>
          Disconnect Wallet
        </Button>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={["click"]}
      open={isDropdownOpen}
      onOpenChange={setIsDropdownOpen}
    >
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
  );
};

export default WalletConnect;
