import React from 'react';
import { AppProps } from 'next/app';
import '../styles/index.css';
import '../styles/wallet-adapter.css'
import { WalletConnectProvider } from '../components/wallet/WalletConnectProvider';
import Script from "next/script";
import { Provider } from 'jotai';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider>
    <WalletConnectProvider>
      <Component {...pageProps} />
    </WalletConnectProvider>
    </Provider>
  );
}

export default MyApp;