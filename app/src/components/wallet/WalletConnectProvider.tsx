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
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => {
        if (network === WalletAdapterNetwork.Devnet) {
            return 'https://aged-bitter-card.solana-devnet.quiknode.pro/553cccbe06b94ae764461f7bbdd47334d0e7eb65'
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