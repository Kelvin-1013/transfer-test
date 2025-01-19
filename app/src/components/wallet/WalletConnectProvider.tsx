import { useMemo } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { 
  PhantomWalletAdapter,
  TrustWalletAdapter 
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

export const WalletConnectProvider = ({ children }) => {
    const network = WalletAdapterNetwork.Mainnet;
    const endpoint = useMemo(() => {
        if (network === WalletAdapterNetwork.Mainnet) {
            return 'https://damp-magical-scion.solana-mainnet.quiknode.pro/6025a0950f7c5f63ad47d47859e487ccab0a094c'
        }
        return clusterApiUrl(network)
    }, [network])

    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new TrustWalletAdapter()
    ], [network])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}