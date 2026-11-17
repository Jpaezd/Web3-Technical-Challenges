
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { BrowserProvider, Contract } from "ethers";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CONTRACT_ABI = [
  "function getMessage() view returns (string)",
  "function setMessage(string newMessage)",
  "event MessageUpdated(string newMessage)",
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SimpleMessagePanel = () => {
  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const getProvider = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== 31337) {
      throw new Error("Please select Hardhat Local (Chain ID 31337).");
    }

    return provider;
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      const provider = await getProvider();
      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts.length) {
        throw new Error("No wallet account available.");
      }

      setAccount(accounts[0]);
      setStatus("Wallet connected successfully.");
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      setStatus(error.shortMessage || error.message || "Wallet connection failed.");
    }
  };

  const readMessage = async () => {
    try {
      setLoading(true);
      setStatus("");

      const provider = await getProvider();

      const code = await provider.getCode(CONTRACT_ADDRESS);

      if (code === "0x") {
        throw new Error("No contract found at the configured address.");
      }

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const result = await contract.getMessage();
      const messageText = String(result);

      console.log("Contract address:", CONTRACT_ADDRESS);
      console.log("Message returned by Solidity:", messageText);

      setMessage(messageText);
      setStatus("Message retrieved successfully.");
    } catch (error: any) {
      console.error("Read error:", error);
      setStatus(
        error.shortMessage ||
        error.message ||
        "Could not read the message."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = async () => {
    if (!newMessage.trim()) {
      setStatus("Please enter a message.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Preparing transaction...");

      const provider = await getProvider();
      const signer = await provider.getSigner();

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const textToSave = newMessage.trim();

      const gasEstimate = await contract.setMessage.estimateGas(textToSave);
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

      setStatus("Waiting for MetaMask confirmation...");

      const transaction = await contract.setMessage(
        textToSave,
        { gasLimit }
      );

      setStatus("Transaction submitted. Waiting for confirmation...");

      const receipt = await transaction.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction was not confirmed successfully.");
      }

      setMessage(textToSave);
      setNewMessage("");
      setStatus("Message updated successfully on the blockchain.");
    } catch (error: any) {
      console.error("Transaction error:", error);
      setStatus(
        error.shortMessage ||
        error.reason ||
        error.message ||
        "Transaction failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4, width: "100%" }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Smart Contract Interaction
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Connect MetaMask and interact with the SimpleMessage Solidity contract.
      </Typography>

      <Button
        variant="contained"
        onClick={connectWallet}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {account
          ? `${account.slice(0, 6)}...${account.slice(-4)}`
          : "Connect MetaMask"}
      </Button>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Button
          variant="outlined"
          onClick={readMessage}
          disabled={loading}
        >
          Read Message
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Current message:{" "}
        {message.length > 0 ? message : "Click Read Message"}
      </Typography>

      <TextField
        fullWidth
        label="New message"
        value={newMessage}
        onChange={(event) => setNewMessage(event.target.value)}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={updateMessage}
        disabled={loading || !account}
      >
        Update Message
      </Button>

      {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}

      {status && (
        <Alert
          severity={
            status.toLowerCase().includes("successfully")
              ? "success"
              : "info"
          }
          sx={{ mt: 2 }}
        >
          {status}
        </Alert>
      )}
    </Paper>
  );
};

export default SimpleMessagePanel;
