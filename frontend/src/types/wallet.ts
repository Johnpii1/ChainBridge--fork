export type ChainType = "stellar" | "ethereum" | "bitcoin";

export interface WalletConnection {
  address: string;
  publicKey: string;
  network?: string | null;
  walletName?: string | null;
  isUnsupportedNetwork?: boolean;
}

export interface WalletState {
  address: string | null;
  publicKey: string | null;
  chain: ChainType | null;
  network: string | null;
  walletName: string | null;
  isUnsupportedNetwork: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  error: string | null;
}

export interface WalletStore extends WalletState {
  connect: (chain: ChainType) => Promise<void>;
  disconnect: () => Promise<void>;
  setBalance: (balance: string) => void;
  setError: (error: string | null) => void;
}

export interface WalletAdapter {
  connect: () => Promise<WalletConnection>;
  disconnect: () => Promise<void>;
  signTransaction: (tx: any) => Promise<any>;
  getBalance: (address: string) => Promise<string>;
}
