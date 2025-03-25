import React, { useEffect, useState } from "react";
import { Layout, Menu } from "antd";
import { useRouter } from "next/router";
import WalletConnect from "../components/WalletConnect";
import Link from "next/link";
import { useWeb3, Role } from "./Web3Provider";

const { Header } = Layout;

const Navbar = () => {
  const router = useRouter();
  const { role } = useWeb3();

   // Menu items for regular users
   const userMenuItems = [
    { key: "/", label: <Link href="/">Home</Link> },
    { key: "/policies", label: <Link href="/policies">Browse Policies</Link> },
    { key: "/my-policies", label: <Link href="/my-policies">My Policies</Link> },
    { key: "/claims", label: <Link href="/claims">Claims & Payouts</Link> },
  ];

  // Menu items for the insurer
  const insurerMenuItems = [
    { key: "/", label: <Link href="/">Home</Link> },
    { key: "/insurer/policies", label: <Link href="/insurer/policies">Policies</Link> },
    { key: "/insurer/claims", label: <Link href="/insurer/claims">Claims & Payouts</Link> },
  ];
    
  return (
    <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "white", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}>
      {/* Logo and brand */}
      <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
        </svg>
        <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "1.25rem", marginLeft: "0.5rem" }}>AutoInsure</span>
      </Link>

      {/* Display tab menu based on role */}
      {role == Role.Company && (
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[router.pathname]}
          items={insurerMenuItems}
          style={{ flex: 1, display: "flex", justifyContent: "center", background: "transparent" }}
        />
      )}

      {role == Role.User && (
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[router.pathname]}
          items={userMenuItems}
          style={{ flex: 1, display: "flex", justifyContent: "center", background: "transparent" }}
        />
      )}

      {/* Connect/Disconnect Wallet */}
      <WalletConnect />
    </Header>
  );
};

export default Navbar;
