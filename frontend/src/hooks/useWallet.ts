import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChainType, WalletStore } from "@/types/wallet";
import { getAdapter } from "../lib/wallets";

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      address: null,
      publicKey: null,
      chain: null,
      network: null,
      walletName: null,
      isUnsupportedNetwork: false,
      isConnected: false,
      isConnecting: false,
      balance: null,
      error: null,

      connect: async (chain: ChainType) => {
        set({ isConnecting: true, error: null });
        try {
          const adapter = getAdapter(chain);
          const { address, publicKey, network, walletName, isUnsupportedNetwork } =
            await adapter.connect();
          const balance = await adapter.getBalance(address);

          set({
            address,
            publicKey,
            chain,
            network: network ?? null,
            walletName: walletName ?? null,
            isUnsupportedNetwork: Boolean(isUnsupportedNetwork),
            isConnected: true,
            isConnecting: false,
            balance,
          });
        } catch (error: any) {
          set({
            error: error.message || "Failed to connect wallet",
            isConnecting: false,
          });
          throw error;
        }
      },

      disconnect: async () => {
        const { chain } = get();
        if (chain) {
          await getAdapter(chain).disconnect();
        }

        set({
          address: null,
          publicKey: null,
          chain: null,
          network: null,
          walletName: null,
          isUnsupportedNetwork: false,
          isConnected: false,
          balance: null,
          error: null,
        });
      },

      setBalance: (balance: string) => set({ balance }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: "chainbridge-wallet",
      partialize: (state) => ({
        address: state.address,
        publicKey: state.publicKey,
        chain: state.chain,
        network: state.network,
        walletName: state.walletName,
        isUnsupportedNetwork: state.isUnsupportedNetwork,
        isConnected: state.isConnected,
      }),
    }
  )
);
