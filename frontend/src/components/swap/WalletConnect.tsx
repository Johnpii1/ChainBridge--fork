"use client";

import { useState } from "react";
import { useWalletStore } from "@/hooks/useWallet";
import { useToast } from "@/hooks/useToast";
import { Button, Badge } from "@/components/ui";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";
import { truncateAddress, formatAmount } from "@/lib/utils";
import { ChainType } from "@/types/wallet";
import config from "@/lib/config";
import { WalletConnectionModal } from "@/components/wallet/WalletConnectionModal";

function formatNetworkLabel(network: string | null | undefined): string {
  if (!network) return "Network unavailable";

  switch (network) {
    case "mainnet":
      return "Mainnet";
    case "testnet":
      return "Testnet";
    case "futurenet":
      return "Futurenet";
    default:
      return network.charAt(0).toUpperCase() + network.slice(1);
  }
}

export function WalletConnect() {
  const {
    address,
    chain,
    network,
    walletName,
    isUnsupportedNetwork,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    balance,
  } = useWalletStore();
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  const networkLabel = formatNetworkLabel(network);
  const expectedNetworkLabel = formatNetworkLabel(config.stellar.network);

  const handleConnect = async (targetChain: ChainType) => {
    try {
      await connect(targetChain);
      const walletState = useWalletStore.getState();

      if (targetChain === "stellar" && walletState.isUnsupportedNetwork) {
        toast.warning(
          "Unsupported Stellar network",
          `Switch Freighter to ${expectedNetworkLabel} to continue with ChainBridge.`
        );
      } else {
        toast.success(
          "Wallet connected",
          targetChain === "stellar"
            ? `${walletState.walletName || "Freighter"} connected on ${formatNetworkLabel(walletState.network)}.`
            : "Your wallet is ready to use."
        );
      }

      setIsOpen(false);
    } catch (e) {
      console.error("Connection failed", e);
      toast.error(
        "Wallet connection failed",
        e instanceof Error ? e.message : "Please try again."
      );
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-xs font-medium text-text-primary">
              {balance ? `${formatAmount(balance, 4)} ${chain?.toUpperCase()}` : "..."}
            </span>
            <span className="text-[10px] text-text-muted">
              {`${walletName || chain?.toUpperCase()} | ${truncateAddress(address)}`}
            </span>
            {chain === "stellar" && (
              <span className="text-[10px] text-text-muted">Network: {networkLabel}</span>
            )}
          </div>
          <Badge variant="chain" chain={chain || ""}>
            {chain?.toUpperCase()}
          </Badge>
          {chain === "stellar" && (
            <Badge variant={isUnsupportedNetwork ? "warning" : "info"}>{networkLabel}</Badge>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => void disconnect()}
            title="Disconnect Wallet"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {chain === "stellar" && isUnsupportedNetwork && (
          <div className="flex max-w-xs items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Freighter is connected to {networkLabel}. Switch to {expectedNetworkLabel} to use
              ChainBridge on the supported Stellar network.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        loading={isConnecting}
        icon={<Wallet className="h-4 w-4" />}
        size="sm"
      >
        Connect Wallet
      </Button>

      <WalletConnectionModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        isConnecting={isConnecting}
        onConnect={handleConnect}
      />
    </>
  );
}
