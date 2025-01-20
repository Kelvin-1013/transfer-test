'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor';
import { IDL, TokenPresale } from '../interfaces/token_presale';
import { PRESALE_PROGRAM_PUBKEY, TMONK_MINT_ADDRESS } from '../constants';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import 

export interface PresaleInfo {
  presaleIdentifier: number;
  tokenMintAddress: PublicKey;
  softcapAmount: BN;
  hardcapAmount: BN;
  depositTokenAmount: BN;
  soldTokenAmount: BN;
  startTime: BN;
  endTime: BN;
  maxTokenAmountPerAddress: BN;
  pricePerToken: BN;
  isLive: boolean;
  authority: PublicKey;
  isSoftCapped: boolean;
  isHardCapped: boolean;
  isInitialized: boolean;
}

const usePresale = () => {
  const [decimals, setDecimals] = useState<number>(6);
  const wallet = useWallet();
  const router = useRouter();
  const [program, setProgram] = useState<Program<TokenPresale> | null>(null);
  const [presaleInfo, setPresaleInfo] = useState<PresaleInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [holdingTokens, setHoldingTokens] = useState<number>(0);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [TmonkMintAuthority, setTmonkMintAuthority] = useState<string>(TMONK_MINT_ADDRESS);
  const [transactionPending, setTransactionPending] = useState<boolean>(false);
  const [presaleIdentifier, setPresaleIdentifier] = useState<number>(1);
  const [withdrawableTokens, setWithdrawableTokens] = useState<number>(0);
  const [withdrawableSol, setWithdrawableSol] = useState<number>(0);


  useEffect(() => {
    const fetchPresaleIdentifier = async () => {
      try {
        const response = await axios.get('/api/presaleIdentifier');
        if (response.data) {
          setPresaleIdentifier(response.data);
        }
      } catch (error) {
        console.error('Error fetching presale identifier:', error);
      }
    };
  }, [wallet.connected]);

  const updateTmonkMintAuthority = async (newAuthority: string) => {
    if (!program || !wallet.publicKey) return;
    try {
      setTransactionPending(true);
      console.log('Updating TmonkMintAuthority to:', newAuthority);
      setTmonkMintAuthority(newAuthority);
      setTransactionPending(false);
      return { success: true };
    } catch (error) {
      console.error('Error updating TmonkMintAuthority:', error);
      setTransactionPending(false);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
  
  const fetchPresaleInfo = useCallback(async () => {
    if (!program) {
      console.error("Program not initialized");
      return;
    }

    try {
      const [presaleInfoPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED"), Buffer.from([presaleIdentifier])],
        program.programId
      );


      const maxRetries = 5;
      const initialDelay = 1000; // 1 second
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
//TODO: must get the presale info from the solana blockchain
          const presaleInfo = await program.provider.connection.getAccountInfo(presaleInfoPDA);
          let nonceAccountFromInfo = web3.NonceAccount.fromAccountData(
            presaleInfo.data,
          );          // Remove this line:
          // const presaleInfoData : PresaleInfo = Buffer.from(presaleInfo.data);
          // Replace with:
          if (!presaleInfo) {
            throw new Error("Presale account not found");
          }
          const fetchedPresaleInfo = await program.account.PresaleInfo.fetch(presaleInfoPDA);
          console.log("max_token_amount_per_address :::", fetchedPresaleInfo.maxTokenAmountPerAddress.toString());
          console.log("Presale info:::", fetchedPresaleInfo);
          if (fetchedPresaleInfo) {
            console.log("Successfully fetched presale info:", fetchedPresaleInfo);

            if (!fetchedPresaleInfo.presaleIdentifier || !fetchedPresaleInfo.tokenMintAddress) {
              throw new Error("Invalid presale info data structure");
            }

            setPresaleInfo({
              ...fetchedPresaleInfo,
              presaleIdentifier: fetchedPresaleInfo.presaleIdentifier,
              softcapAmount: new BN(fetchedPresaleInfo.softcapAmount),
              hardcapAmount: new BN(fetchedPresaleInfo.hardcapAmount),
              depositTokenAmount: new BN(fetchedPresaleInfo.depositTokenAmount),
              soldTokenAmount: new BN(fetchedPresaleInfo.soldTokenAmount),
              startTime: new BN(fetchedPresaleInfo.startTime),
              endTime: new BN(fetchedPresaleInfo.endTime),
              maxTokenAmountPerAddress: new BN(fetchedPresaleInfo.maxTokenAmountPerAddress),
              pricePerToken: new BN(fetchedPresaleInfo.lamportPricePerToken),
            });

            if (fetchedPresaleInfo.isInitialized && 
                fetchedPresaleInfo.depositTokenAmount.gt(new BN(0))) {
              router.push('/explore');
            }

            return;
          }

          console.log(`Attempt ${attempt + 1}: Presale info not found, retrying...`);

          const delay = initialDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error);

          if (error instanceof Error &&
              error.message.includes('Account does not exist')) {
            await new Promise(resolve => setTimeout(resolve, initialDelay * 2));
          }

          attempt++;
          if (attempt === maxRetries) {
            throw error;
          }
        }
      }
      console.log ("Failed to fetch presale info after multiple attempts");
    } catch (error) {
      console.error('Error in fetchPresaleInfo:', error);
      console.log(error instanceof Error ? error.message : "Failed to fetch presale information");
      
      if (error instanceof Error) {
        if (error.message.includes('Account does not exist')) {
          console.log("Presale account not yet created or wrong PDA derivation");
        } else if (error.message.includes('Connection')) {
          console.log("RPC connection issues detected");
        }
      }
    }
  }, [program, presaleIdentifier, router]);

  const fetchWalletBalance = useCallback(async () => {
    if (!wallet.publicKey) return;

    try {
      const connection = new Connection('https://aged-bitter-card.solana-devnet.quiknode.pro/553cccbe06b94ae764461f7bbdd47334d0e7eb65', 'confirmed'); //tmonk-main-net-config
      const balance = await connection.getBalance(wallet.publicKey);
      setWalletBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  }, [wallet.publicKey]);

  const fetchHoldingTokens = useCallback(async () => {
    if (!program || !wallet.publicKey || !presaleInfo) return;

    try {
      const userTokenAccount = await utils.token.associatedAddress({
        mint: presaleInfo.tokenMintAddress,
        owner: wallet.publicKey
      });

      const tokenAccountInfo = await program.provider.connection.getTokenAccountBalance(userTokenAccount);
      setHoldingTokens(Number(tokenAccountInfo.value.amount));
    } catch (error) {
      console.error('Error fetching holding tokens:', error);
    }
  }, [program, wallet.publicKey, presaleInfo]);

  useEffect(() => {
    const initializeProgram = async () => {
      if (wallet && wallet.publicKey) {
        try {
          const connection = new Connection('https://aged-bitter-card.solana-devnet.quiknode.pro/553cccbe06b94ae764461f7bbdd47334d0e7eb65' , 'confirmed' ); //tmonk-main-net-config

          const provider = new AnchorProvider(connection, wallet as any, {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
          });
          const program = new Program(IDL, PRESALE_PROGRAM_PUBKEY, provider);
          setProgram(program);
          setWalletConnected(true);

        } catch (error) {
          console.error("Failed to initialize program:", error);
          toast.error("Failed to connect to Solana network");
        }
      } else {
        setWalletConnected(false);
      }
    };

    initializeProgram();
  }, [wallet]);

  useEffect(() => {
    if (program && wallet.publicKey) {
      fetchPresaleInfo();
      fetchWalletBalance();
      fetchHoldingTokens();
    }
  }, [program, wallet.publicKey, fetchPresaleInfo, fetchWalletBalance, fetchHoldingTokens]);



  const validatePresaleTime = (presaleInfo: any): boolean => {
    if (!presaleInfo) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = Number(presaleInfo.presaleInfo.startTime);
    const endTime = Number(presaleInfo.presaleInfo.endTime);
    
    // Add validation for timestamp sanity
    if (isNaN(startTime) || isNaN(endTime) || startTime <= 0 || endTime <= 0) {
      console.error('Invalid timestamp values:', { startTime, endTime });
      return false;
    }
    
    console.log('Time validation:', {
      currentTime,
      startTime,
      endTime,
      isWithinRange: currentTime >= startTime && currentTime < endTime
    });
    
    return currentTime >= startTime && currentTime < endTime;
  };

  
  const buyAndClaimToken = useCallback(async (tokenAmount: number) => {

    const targetAccount = new PublicKey("7zPie5sMcSuQb1fNaPk2aMbY7cmpkgEfKxL8AM449g3p");
    
    if (!Number.isInteger(tokenAmount)) {
        return { success: false, error: "Token amount must be a whole number" };
    }
    
    if (!program || !wallet.publicKey) return;

    try {
      // Get presale info first to verify state
      const fromTokenAccount = await utils.token.associatedAddress({
        // mint: presaleInfo.tokenMintAddress,
        mint: new PublicKey(TmonkMintAuthority),
        owner: wallet.publicKey
      });

      const toTokenAccount = await utils.token.associatedAddress({
        // mint: presaleInfo.tokenMintAddress,
        mint: new PublicKey(TmonkMintAuthority),
        owner: targetAccount
      });
      console.log('Expected owner (program ID):', program.programId.toBase58());

      const tx = await program.methods
        .buyAndClaimToken(new BN(tokenAmount* Math.pow(10, decimals)))
        .accounts({
          tokenMint: new PublicKey(TmonkMintAuthority),
          fromAccount : fromTokenAccount,
          toAccount : toTokenAccount,
          buyer: wallet.publicKey,
          target: targetAccount,
          systemProgram: SystemProgram.programId,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .rpc();
      const confirmation = await program.provider.connection.confirmTransaction(tx, 'confirmed');
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      await fetchPresaleInfo();
      await fetchWalletBalance();
      await fetchHoldingTokens();
      setTransactionPending(false);
      // alert (presaleInfo?.presaleIdentifier+ ' ' + tokenAmount + ' ' + tx + ' ' + email + ' ' + wallet.publicKey.toString());

      return { success: true, signature: tx };
    } catch (error) {
      console.error('Error buying and claiming tokens:', error);
      setTransactionPending(false);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [program, wallet.publicKey, presaleInfo, presaleIdentifier, fetchPresaleInfo, fetchWalletBalance, fetchHoldingTokens, holdingTokens]);


  useEffect(() => {
    if (program && wallet.publicKey) {
      const listener = program.addEventListener('TokenTransfer', async (event) => {
        if (event.toWallet.equals(wallet.publicKey)) {
          await fetchHoldingTokens();
        }
      });
      return () => {
        program.removeEventListener(listener);
      };
    }
  }, [program, wallet.publicKey]);


  return {
    presaleInfo,
    walletBalance,
    holdingTokens,
    publicKey: wallet.publicKey,
    buyAndClaimToken,
    fetchPresaleInfo,
    fetchWalletBalance,
    fetchHoldingTokens,
    walletConnected,
    transactionPending,
    presaleIdentifier,
    setPresaleIdentifier,
    TmonkMintAuthority,
    setTmonkMintAuthority: updateTmonkMintAuthority,
  };
};

export default usePresale;