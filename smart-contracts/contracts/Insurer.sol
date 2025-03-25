// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlightPolicy.sol";

contract Insurer {
    address public insurerAddress;
    FlightPolicy public flightPolicy;

    event PolicyAdded(uint256 templateId);
    event PolicyDeleted(uint256 templateId);
    event PolicyBought(uint256 policyId);
    event Payout(uint256 amount, address recipient);

    modifier companyOnly() {
        require(msg.sender == insurerAddress, "Only company can call this");
        _;
    }

    constructor(address _flightPolicyAddress) {
        insurerAddress = msg.sender;
        flightPolicy = FlightPolicy(_flightPolicyAddress);
    }

    // ========== Company Actions ==========

    function createPolicyTemplate(
        uint256 activeDuration,
        uint256 premium,
        uint256 delayPayout,
        uint256 delayThreshold,
        uint256 maxPayout
    ) external companyOnly {
        uint256 templateId = flightPolicy.createPolicyTemplate(
            activeDuration,
            premium,
            delayPayout,
            delayThreshold,
            maxPayout
        );
        emit PolicyAdded(templateId);
    }

    function deletePolicyTemplate(uint256 templateId) external companyOnly {
        flightPolicy.deletePolicyTemplate(templateId);
        emit PolicyDeleted(templateId);
    }

    function withdrawFunds(uint256 amountInWei) external companyOnly {
        require(amountInWei <= address(this).balance, "Insufficient balance");
        payable(insurerAddress).transfer(amountInWei);
    }

    // ========== User Actions ==========

    function purchasePolicy(
        uint256 templateId,
        string memory flight,
        uint256 departureTime
    ) external payable {
        // Validate template
        FlightPolicy.PolicyTemplate memory tpl = flightPolicy.getPolicyTemplate(templateId);
        require(msg.value >= tpl.premium, "Insufficient ETH sent");
        require(departureTime > block.timestamp, "Flight must be in the future");

        // Allow user to purchase multiple policies, including overlapping ones

        // Proceed with purchase
        uint256 newPolicyId = flightPolicy.purchasePolicy(templateId, flight, departureTime, msg.sender);
        emit PolicyBought(newPolicyId);
    }

    function claimPolicy(uint256 userPolicyIndex) external {
        FlightPolicy.UserPolicy[] memory policies = flightPolicy.getPoliciesOf(msg.sender);
        require(userPolicyIndex < policies.length, "Invalid policy index");

        FlightPolicy.UserPolicy memory userPolicy = policies[userPolicyIndex];
        FlightPolicy.PolicyTemplate memory tpl = flightPolicy.getPolicyTemplate(userPolicy.templateId);

        require(userPolicy.status == FlightPolicy.PolicyStatus.Active, "Policy is not active");

        uint256 payout = tpl.delayPayout;
        if (payout > tpl.maxPayout) {
            payout = tpl.maxPayout;
        }

        payable(userPolicy.insured).transfer(payout);
        flightPolicy.markAsClaimed(msg.sender, userPolicyIndex);
        emit Payout(payout, userPolicy.insured);
    }

    // ========== Public View Functions ==========

    function getPolicyOfCustomer(address user) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getPoliciesOf(user);
    }

    function getCompanyPolicies() external view returns (FlightPolicy.PolicyTemplate[] memory) {
        return flightPolicy.getAllPolicyTemplates();
    }

    function isCompany(address user) public view returns (bool) {
        return user == insurerAddress;
    }

    receive() external payable {}
}
