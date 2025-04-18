import { Layout, Menu } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import WalletConnect from "./WalletConnect";
import { useWeb3, Role } from "./Web3Provider";

const { Header } = Layout;

const Navbar = () => {
  const router = useRouter();
  const { role } = useWeb3();

  // Common menu items
  const commonMenuItems = [
    { key: "/", label: <Link href="/">Home</Link> },
  ];

  // Menu items for users and insurers
  const userMenuItems = [
    ...commonMenuItems,
    { key: "/user/BrowsePolicyTemplates", label: <Link href="/user/BrowsePolicyTemplates">Browse Policies</Link> },
    { key: "/user/MyPolicies", label: <Link href="/user/MyPolicies">My Policies</Link> },
    { key: "/user/MyClaims", label: <Link href="/user/MyClaims">Claims & Payouts</Link> },
  ];

  const insurerMenuItems = [
    ...commonMenuItems,
    { key: "/insurer/InsurerPolicyTemplates", label: <Link href="/insurer/InsurerPolicyTemplates">Policy Templates</Link> },
    { key: "/insurer/InsurerClaimsOverview", label: <Link href="/insurer/InsurerClaimsOverview">Claims & Payouts</Link> },
  ];

  // Get selected key for the current route
  const getSelectedKey = () => router.pathname;

  // Fallback to an empty menu if no role is found
  const roleMenuItems = role === Role.User ? userMenuItems : role === Role.Insurer ? insurerMenuItems : [];

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

      {/* Render menu based on role */}
      {role && (
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          items={roleMenuItems}
          style={{ flex: 1, display: "flex", justifyContent: "center", background: "transparent" }}
        />
      )}

      {/* Connect/Disconnect Wallet */}
      <WalletConnect />
    </Header>
  );
};

export default Navbar;
