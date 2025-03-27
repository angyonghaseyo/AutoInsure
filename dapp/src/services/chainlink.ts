import { ethers } from 'ethers';
import OracleConnectorABI from '../utils/abis/OracleConnector.json';

export interface FlightData {
  isDelayed: boolean;
  delayMinutes: number;
  dataReceived: boolean;
}

/**
 * Fetches flight data from the Oracle Connector contract
 * @param oracleConnector The Oracle Connector contract instance
 * @param flightNumber Flight number (e.g., "AA123")
 * @param departureTime Departure time as Unix timestamp
 * @returns Flight data including delay information
 */
export async function getFlightStatus(
  oracleConnector: ethers.Contract,
  flightNumber: string,
  departureTime: number
): Promise<FlightData> {
  try {
    // Request flight data from oracle
    const tx = await oracleConnector.getFlightStatus(flightNumber, departureTime);
    await tx.wait();
    
    // Get cached flight data after request
    return await getCachedFlightData(oracleConnector, flightNumber, departureTime);
  } catch (error) {
    console.error('Error getting flight status:', error);
    // Return default empty data
    return {
      isDelayed: false,
      delayMinutes: 0,
      dataReceived: false
    };
  }
}

/**
 * Fetches cached flight data from the Oracle Connector contract
 * @param oracleConnector The Oracle Connector contract instance
 * @param flightNumber Flight number (e.g., "AA123")
 * @param departureTime Departure time as Unix timestamp
 * @returns Flight data including delay information
 */
export async function getCachedFlightData(
  oracleConnector: ethers.Contract,
  flightNumber: string,
  departureTime: number
): Promise<FlightData> {
  try {
    // Get cached flight data
    const [isDelayed, delayMinutes, dataReceived] = await oracleConnector.getCachedFlightData(
      flightNumber,
      departureTime
    );
    
    return {
      isDelayed,
      delayMinutes: Number(delayMinutes),
      dataReceived
    };
  } catch (error) {
    console.error('Error getting cached flight data:', error);
    // Return default empty data
    return {
      isDelayed: false,
      delayMinutes: 0,
      dataReceived: false
    };
  }
}

/**
 * Creates an Oracle Connector contract instance
 * @param provider Ethers provider
 * @param address Oracle Connector contract address
 * @returns Oracle Connector contract instance
 */
export function getOracleConnectorContract(
  provider: ethers.providers.Provider | ethers.Signer,
  address: string
): ethers.Contract {
  return new ethers.Contract(address, OracleConnectorABI.abi, provider);
}

/**
 * Formats flight delay status into a human-readable string
 * @param isDelayed Whether the flight is delayed
 * @param delayMinutes Number of minutes the flight is delayed
 * @returns Formatted delay status string
 */
export function formatDelayStatus(isDelayed: boolean, delayMinutes: number): string {
  if (!isDelayed) {
    return 'On time';
  }
  
  if (delayMinutes < 60) {
    return `Delayed by ${delayMinutes} minutes`;
  }
  
  const hours = Math.floor(delayMinutes / 60);
  const minutes = delayMinutes % 60;
  
  if (minutes === 0) {
    return `Delayed by ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `Delayed by ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
}