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

  const fetchDecimalsFromCurrentPresale = useCallback(async () => {
    try {
      const response = await axios.get('/api/current');
      if (response.data.success && response.data.presaleInfo?.decimals !== undefined) {
        setDecimals(response.data.presaleInfo.decimals);
        console.log('Decimals fetched from database:', response.data.presaleInfo.decimals);
      }
    } catch (error) {
      console.error('Error fetching decimals from current presale:', error);
    }
  }, []);

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

          // Fetch decimals when program is initialized
          await fetchDecimalsFromCurrentPresale();
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

  const fetchPresaleInfoFromDB = useCallback(async () => {
    if (!wallet.publicKey) return null;
    
    try {
      const response = await axios.get(`/api/presale?publicKey=${wallet.publicKey.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching presale info from DB:', error);
      return null;
    }
  }, [wallet.publicKey]);
  
  const getCurrentPresaleFromDB = useCallback(async () => {
    try {
      const response = await axios.get('/api/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current presale from DB:', error);
      return null;
    }
  }, []);
  const setCurrentPresaleInDB = useCallback(async (presaleIdentifier: number) => {
    if (!wallet.publicKey) return;
    try {

      return response.data;
    } catch (error) {
      console.error('Error setting current presale in DB:', error);
      return null;
    }
  }, [wallet.publicKey]);

  const getWithdrawableTokensAndSol = useCallback(async () => {
    // TODO: must get the withdrawable tokens and sol from the solana blockchain
    const currentPresaleInfo = await getCurrentPresaleFromDB();
    return {
      TokenAmountFromSolana: currentPresaleInfo.presaleInfo.depositTokenAmount || 0,
      SolTokenAmountFromSolana: currentPresaleInfo.presaleInfo.receivedSolAmount || 0,
    };
  }, [wallet.publicKey]);

  const createAndStartPresale = useCallback(async (
    presaleIdentifier: number,
    tokenMintAddress: PublicKey,
    softcapAmount: number,
    hardcapAmount: number,
    maxTokenAmountPerAddress: number,
    minTokenAmountPerAddress: number,
    pricePerToken: number,
    startTime: number,
    endTime: number,
    decimals: number
  ) => {
    if (!program || !wallet.publicKey) return;
    try {
      setTransactionPending(true);
      const [presaleInfoPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED"), Buffer.from([presaleIdentifier])],
        program.programId
      );
      
      const softcapAmountBN = new BN(
        (softcapAmount * Math.pow(10, decimals)).toString()
      );
      const hardcapAmountBN = new BN(
        (hardcapAmount * Math.pow(10, decimals)).toString()
      );

      // Fetch SOL price from CoinGecko API
      const solPriceResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const solPriceInUSD = solPriceResponse.data.solana.usd;

      // Convert price to string to handle large numbers
      const pricePerTokenInSOL = pricePerToken / solPriceInUSD;
      const pricePerTokenInLamports = new BN(
        Math.floor(pricePerTokenInSOL * LAMPORTS_PER_SOL)
      );
      alert(tokenMintAddress.toString());

      console.log("Derived PDA:", presaleInfoPDA.toBase58());
      const tx = await program.methods
        .createAndStartPresale(
          presaleIdentifier,
          tokenMintAddress,
          softcapAmountBN,
          hardcapAmountBN,
          new BN(maxTokenAmountPerAddress),
          pricePerTokenInLamports, // Price per smallest token unit
          new BN(startTime),
          new BN(endTime),
          decimals
        )
        .accounts({
          presaleInfo: presaleInfoPDA,
          tokenMint: tokenMintAddress,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      const response = await axios.post('/api/presale', {
        publicKey: wallet.publicKey.toString(),
        presaleInfo: {
          presaleIdentifier,
          tokenMintAddress: tokenMintAddress.toString(),
          softcapAmount,
          hardcapAmount,
          maxTokenAmountPerAddress,
          minTokenAmountPerAddress,
          pricePerToken,
          startTime,
          endTime,
          decimals,
          signature: tx,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save presale information');
      }

      await fetchPresaleInfo();
      setTransactionPending(false);
      return { success: true, signature: tx };
    } catch (error) {
      console.error('Error creating and starting presale:', error);
      setTransactionPending(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [program, wallet.publicKey, fetchPresaleInfo]);

  const depositToken = useCallback(async (amount: number) => {
    if (!program || !wallet.publicKey) {
      console.error("Program or wallet not initialized");
      return { success: false, error: 'Program or wallet not initialized' };
    }
  
    try {
      setTransactionPending(true);
      
      // Calculate actual amount with decimals
      const actualAmount = new BN(
        (amount * Math.pow(10, decimals)).toString()
      );

      const [presaleInfoPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED"), Buffer.from([presaleIdentifier])],
        program.programId
      );
      const [presaleVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_VAULT"), Buffer.from([presaleIdentifier])],
        program.programId
      );
      const fromTokenAccount = await utils.token.associatedAddress({
        mint: new PublicKey(TmonkMintAuthority),
        owner: wallet.publicKey
      });
      const toTokenAccount = await utils.token.associatedAddress({
        mint: new PublicKey(TmonkMintAuthority),
        owner: presaleInfoPDA
      });
      const vaultInfo = await program.provider.connection.getAccountInfo(presaleVaultPDA);
      const presaleInfo = await program.provider.connection.getAccountInfo(presaleInfoPDA);
      console.log('PDAs:', {
        presaleVaultPDA_owner: vaultInfo?.owner.toBase58(),
        presaleInfoPDA_owner: presaleInfo?.owner.toBase58(), 
        programId: program.programId.toBase58()
      });
      const tx = await program.methods
        .depositToken(actualAmount)
        .accounts({
          mintAccount: new PublicKey(TmonkMintAuthority),
          fromAssociatedTokenAccount: fromTokenAccount,
          fromAuthority: wallet.publicKey,
          toAssociatedTokenAccount: toTokenAccount,
          presaleVault: presaleVaultPDA,
          presaleInfo: presaleInfoPDA,
          admin: wallet.publicKey,
          rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .rpc();
  
      // Get current presale info before updating
      const currentPresale = await axios.get(`/api/presale?publicKey=${wallet.publicKey.toString()}`);
      const currentPresaleInfo = currentPresale.data?.presaleInfo || {};

      // Update current presale info

      
      // // Update presale information with accumulated deposit amount
      // await axios.post('/api/presale', {
      //   publicKey: wallet.publicKey.toString(),
      //   presaleInfo: {
      //     ...currentPresaleInfo, // Keep all existing presale info
      //     presaleIdentifier,
      //     depositTokenAmount: (currentPresaleInfo.depositTokenAmount || 0) + amount,
      //     signature: tx,
      //     updatedAt: new Date(),
      //   }
      // });
  
      // Save token activity

  

  
      await fetchPresaleInfo();
      setTransactionPending(false);
      return { success: true, signature: tx };
    } catch (error) {
      console.error('Error in depositToken:', error);
      setTransactionPending(false);
      return { 
        success: false, 
        error: error instanceof Error 
          ? `Deposit failed: ${error.message}` 
          : 'Unknown error occurred during deposit'
      };
    }
  }, [program, wallet.publicKey, presaleIdentifier, fetchPresaleInfo, TmonkMintAuthority, decimals]);
 
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

  
  const buyAndClaimToken = useCallback(async (tokenAmount: number, email: string , solAmount:number) => {

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
        owner: targetAccount
      });

      const toTokenAccount = await utils.token.associatedAddress({
        // mint: presaleInfo.tokenMintAddress,
        mint: new PublicKey(TmonkMintAuthority),
        owner: targetAccount
      });
      console.log('Expected owner (program ID):', program.programId.toBase58());
      alert (TmonkMintAuthority.toString() );
      alert (utils.token.ASSOCIATED_PROGRAM_ID.toString() );

      const tx = await program.methods
        .buyAndClaimToken(new BN(tokenAmount* decimals))
        .accounts({
          tokenMint: new PublicKey(TmonkMintAuthority),
          fromAccount : fromTokenAccount,
          toAccount : toTokenAccount,
          buyer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .rpc();


      // const tx = await program.methods
      //   .buyAndClaimToken(new BN(tokenAmount))
      //   .accounts({
      //     tokenMint: new PublicKey(TmonkMintAuthority),
      //     buyerTokenAccount: buyerTokenAccount,
      //     presaleTokenAccount: presaleTokenAccount,
      //     presaleInfo: presaleInfoPDA,
      //     presaleAuthority: presaleAuthorityPDA, // Use the separate authority PDA
      //     presaleVault: presaleVaultPDA,
      //     buyer: wallet.publicKey,
      //     buyerAccount: buyerAccountPDA,
      //     systemProgram: SystemProgram.programId,
      //     tokenProgram: utils.token.TOKEN_PROGRAM_ID,
      //     associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      //   })
      //   .rpc();

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

  const withdraw = useCallback(async (presaleIdentifier: number, amount: number, withdrawType: 'Sol' | 'Token') => {
    if (!program || !wallet.publicKey) return;

    try {
      setTransactionPending(true);
      const [presaleInfoPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_SEED"), Buffer.from([presaleIdentifier])],
        program.programId
      );

      const [presaleVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("PRESALE_VAULT"), Buffer.from([presaleIdentifier])],
        program.programId
      );

      const accounts: any = {
        presaleInfo: presaleInfoPDA,
        presaleVault: presaleVaultPDA,
        admin: wallet.publicKey,
        tokenMint: new PublicKey(TmonkMintAuthority),
        presaleTokenAccount: await utils.token.associatedAddress({
          mint: new PublicKey(TmonkMintAuthority),
          owner: presaleInfoPDA
        }),
        adminTokenAccount: await utils.token.associatedAddress({
          mint: new PublicKey(TmonkMintAuthority),
          owner: wallet.publicKey
        }),
        systemProgram: SystemProgram.programId,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      };
       console.log('accounts', accounts);
      let realAmount = new BN(0);
      if (withdrawType === 'Token') {
        realAmount = new BN(amount * Math.pow(10, decimals));
      } else {
        realAmount = new BN(amount * LAMPORTS_PER_SOL);
      }

      const tx = await program.methods
        .withdraw(realAmount, { [withdrawType.toLowerCase()]: {} })
        .accounts(accounts)
        .rpc();

      // After successful withdrawal, update the states
      const withdrawableResponse = await getWithdrawableTokensAndSol();
      setWithdrawableTokens(withdrawableResponse.TokenAmountFromSolana);
      setWithdrawableSol(withdrawableResponse.SolTokenAmountFromSolana);


      await fetchPresaleInfo();
      if (withdrawType === 'Token') {
        await fetchHoldingTokens();
      } else {
        await fetchWalletBalance();
      }
      setTransactionPending(false);
      return { success: true, signature: tx };
    } catch (error) {
      console.error('Error withdrawing:', error);
      setTransactionPending(false);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [program, wallet.publicKey, presaleInfo, fetchPresaleInfo, fetchHoldingTokens, fetchWalletBalance, getWithdrawableTokensAndSol]);

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

  const fetchCurrentPresaleInfo = useCallback(async () => {
    try {
      const response = await axios.get('/api/current');
      console.log('Current Presale Response:', response.data);
      
      if (response.data.success && response.data.presaleInfo) {
        const presaleData = response.data.presaleInfo;
        return {
          presaleIdentifier: Number(presaleData.presaleIdentifier),
          tokenMintAddress: presaleData.tokenMintAddress,
          softcapAmount: Number(presaleData.softcapAmount),
          hardcapAmount: Number(presaleData.hardcapAmount),
          depositTokenAmount: Number(presaleData.depositTokenAmount),
          soldTokenAmount: Number(presaleData.soldTokenAmount),
          startTime: Number(presaleData.startTime),
          endTime: Number(presaleData.endTime),
          maxTokenAmountPerAddress: Number(presaleData.maxTokenAmountPerAddress),
          pricePerToken: Number(presaleData.pricePerToken),
          isLive: Boolean(presaleData.isLive),
          isSoftCapped: Boolean(presaleData.isSoftCapped),
          isHardCapped: Boolean(presaleData.isHardCapped),
          isInitialized: Boolean(presaleData.isInitialized)
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching current presale info:', error);
      return null;
    }
  }, []);

  return {
    presaleInfo,
    walletBalance,
    holdingTokens,
    publicKey: wallet.publicKey,
    createAndStartPresale,
    depositToken,
    buyAndClaimToken,
    withdraw,
    fetchPresaleInfo,
    fetchWalletBalance,
    fetchHoldingTokens,
    getCurrentPresaleFromDB,
    setCurrentPresaleInDB,
    fetchPresaleInfoFromDB,
    walletConnected,
    transactionPending,
    presaleIdentifier,
    setPresaleIdentifier,
    TmonkMintAuthority,
    setTmonkMintAuthority: updateTmonkMintAuthority,
    fetchCurrentPresaleInfo,
    getWithdrawableTokensAndSol,
  };
};

export default usePresale;