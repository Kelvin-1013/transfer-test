export async function callSplit( 
    wallet, 
    connection, 
  ) { 
   
    programID = new PublicKey("4jcbcXzbNT4c6x3tKCxssE58K8kEJhJ49VCGu7w1WQ7V"); 
    MINT_ADDRESS = new PublicKey("14pjyuCAhjaNVyjwKotMyRrb4iTeb4wvuYuEYc8hPuDW"); 
    const USER_ADDRESS = new PublicKey("7zPie5sMcSuQb1fNaPk2aMbY7cmpkgEfKxL8AM449g3p"); 
    const SEND_AMOUNT = 1000000; 
   
    const mintInfo = await connection.getAccountInfo(MINT_ADDRESS); 
    if (!mintInfo) { 
      throw new Error('Invalid mint address'); 
    } 
   
    const programStandard = TOKEN_2022_PROGRAM_ID; 
    const provider = createProvider(wallet, connection); 
    console.log(provider); 
     
    // Ensure IDL is properly imported and valid 
    if (!IDL || !IDL.metadata || !IDL.metadata.address) { 
      throw new Error('Invalid IDL configuration'); 
    } 
     
    const program = new Program(IDL, programID, provider); 
    console.log(program); 
    const transaction = createTransaction(); 
   
    const associatedToken = getAssociatedTokenAddressSync( 
      MINT_ADDRESS, 
      wallet.publicKey, 
      false, 
      programStandard 
    ); 
   
    const senderAtaInstruction = 
      createAssociatedTokenAccountIdempotentInstruction( 
        wallet.publicKey, 
        associatedToken, 
        wallet.publicKey, 
        MINT_ADDRESS, 
        programStandard 
      ); 
   
    transaction.add(senderAtaInstruction); 
   
    const recipientAssociatedToken = getAssociatedTokenAddressSync( 
      MINT_ADDRESS, 
      USER_ADDRESS, 
      false, 
      programStandard 
    ); 
   
    const recipientAtaInstruction = 
      createAssociatedTokenAccountIdempotentInstruction( 
        wallet.publicKey, 
        recipientAssociatedToken, 
        USER_ADDRESS, 
        MINT_ADDRESS, 
        programStandard 
      ); 
       
    transaction.add(recipientAtaInstruction); 
   
    // Fix: Get mint decimals using getMint method 
    const mint = await connection.getTokenSupply(MINT_ADDRESS); 
    const decimals = mint.value.decimals; 
    // Fix: Ensure proper BN calculation 
    const multiplier = new BN(10).pow(new BN(decimals)); 
    const sendAmount = new BN(SEND_AMOUNT).mul(multiplier); 
   
    transaction.add( 
      await program.methods 
        .sendToken(sendAmount) 
        .accounts({ 
          from: associatedToken, 
          authority: wallet.publicKey, 
          mint: MINT_ADDRESS, 
          recipient: recipientAssociatedToken, 
          tokenProgram: programStandard, 
        }) 
        .instruction() 
    ); 
   
    return await provider.sendAndConfirm(transaction); 
  }