'use client';
import dynamic from 'next/dynamic';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const WalletMultiButtonDynamic = dynamic(
    () => Promise.resolve(WalletMultiButton),
    { ssr: false }
);

export default WalletMultiButtonDynamic;