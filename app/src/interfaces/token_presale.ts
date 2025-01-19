
export type TokenPresale =
{
  "version": "0.1.0",
  "name": "token_presale",
  "instructions": [
    {
      "name": "buyAndClaimToken",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fromAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "PresaleInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "presaleIdentifier",
            "type": "u8"
          },
          {
            "name": "tokenMintAddress",
            "type": "publicKey"
          },
          {
            "name": "softcapAmount",
            "type": "u64"
          },
          {
            "name": "hardcapAmount",
            "type": "u64"
          },
          {
            "name": "depositTokenAmount",
            "type": "u64"
          },
          {
            "name": "soldTokenAmount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "maxTokenAmountPerAddress",
            "type": "u64"
          },
          {
            "name": "lamportPricePerToken",
            "type": "u64"
          },
          {
            "name": "isLive",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "isSoftCapped",
            "type": "bool"
          },
          {
            "name": "isHardCapped",
            "type": "bool"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "decimalPerToken",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "BuyerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "purchasedAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PresaleNotInitialized",
      "msg": "Presale is not initialized"
    },
    {
      "code": 6001,
      "name": "InvalidDecimals",
      "msg": "Invalid decimals"
    },
    {
      "code": 6002,
      "name": "PresaleNotLive",
      "msg": "Presale is not live"
    },
    {
      "code": 6003,
      "name": "PresaleNotActive",
      "msg": "Presale is not active"
    },
    {
      "code": 6004,
      "name": "ExceedsMaxPerAddress",
      "msg": "Exceeds maximum tokens per address"
    },
    {
      "code": 6005,
      "name": "InsufficientTokens",
      "msg": "Insufficient tokens available"
    },
    {
      "code": 6006,
      "name": "Unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6007,
      "name": "PresaleStillActive",
      "msg": "Presale is still active"
    },
    {
      "code": 6008,
      "name": "SoftcapNotReached",
      "msg": "Softcap not reached"
    },
    {
      "code": 6009,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6010,
      "name": "AlreadyInitialized",
      "msg": "Presale already initialized"
    },
    {
      "code": 6011,
      "name": "InvalidCapAmounts",
      "msg": "Invalid cap amounts"
    },
    {
      "code": 6012,
      "name": "InvalidTimeRange",
      "msg": "Invalid time range"
    },
    {
      "code": 6013,
      "name": "InvalidStartTime",
      "msg": "Invalid start time"
    },
    {
      "code": 6014,
      "name": "InvalidParameters",
      "msg": "Invalid parameters"
    },
    {
      "code": 6015,
      "name": "PresaleAlreadyStarted",
      "msg": "Presale already started"
    },
    {
      "code": 6016,
      "name": "ExceedsHardcap",
      "msg": "Exceeds hardcap"
    },
    {
      "code": 6017,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6018,
      "name": "InvalidPresaleIdentifier",
      "msg": "Invalid presale identifier"
    },
    {
      "code": 6019,
      "name": "InvalidTokenAccount",
      "msg": "Invalid token account"
    },
    {
      "code": 6020,
      "name": "InvalidPresaleAuthority",
      "msg": "Invalid presale authority"
    },
    {
      "code": 6021,
      "name": "InvalidVaultOwner",
      "msg": "Invalid vault owner"
    },
    {
      "code": 6022,
      "name": "MissingRequiredSignature",
      "msg": "Missing required signature"
    },
    {
      "code": 6023,
      "name": "PresaleAlreadyDeposited",
      "msg": "Cannot reinitialize presale after tokens have been deposited"
    }
  ]
}

export const IDL: TokenPresale =
{
  "version": "0.1.0",
  "name": "token_presale",
  "instructions": [
    {
      "name": "buyAndClaimToken",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fromAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "PresaleInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "presaleIdentifier",
            "type": "u8"
          },
          {
            "name": "tokenMintAddress",
            "type": "publicKey"
          },
          {
            "name": "softcapAmount",
            "type": "u64"
          },
          {
            "name": "hardcapAmount",
            "type": "u64"
          },
          {
            "name": "depositTokenAmount",
            "type": "u64"
          },
          {
            "name": "soldTokenAmount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "maxTokenAmountPerAddress",
            "type": "u64"
          },
          {
            "name": "lamportPricePerToken",
            "type": "u64"
          },
          {
            "name": "isLive",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "isSoftCapped",
            "type": "bool"
          },
          {
            "name": "isHardCapped",
            "type": "bool"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "decimalPerToken",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "BuyerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "purchasedAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PresaleNotInitialized",
      "msg": "Presale is not initialized"
    },
    {
      "code": 6001,
      "name": "InvalidDecimals",
      "msg": "Invalid decimals"
    },
    {
      "code": 6002,
      "name": "PresaleNotLive",
      "msg": "Presale is not live"
    },
    {
      "code": 6003,
      "name": "PresaleNotActive",
      "msg": "Presale is not active"
    },
    {
      "code": 6004,
      "name": "ExceedsMaxPerAddress",
      "msg": "Exceeds maximum tokens per address"
    },
    {
      "code": 6005,
      "name": "InsufficientTokens",
      "msg": "Insufficient tokens available"
    },
    {
      "code": 6006,
      "name": "Unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6007,
      "name": "PresaleStillActive",
      "msg": "Presale is still active"
    },
    {
      "code": 6008,
      "name": "SoftcapNotReached",
      "msg": "Softcap not reached"
    },
    {
      "code": 6009,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6010,
      "name": "AlreadyInitialized",
      "msg": "Presale already initialized"
    },
    {
      "code": 6011,
      "name": "InvalidCapAmounts",
      "msg": "Invalid cap amounts"
    },
    {
      "code": 6012,
      "name": "InvalidTimeRange",
      "msg": "Invalid time range"
    },
    {
      "code": 6013,
      "name": "InvalidStartTime",
      "msg": "Invalid start time"
    },
    {
      "code": 6014,
      "name": "InvalidParameters",
      "msg": "Invalid parameters"
    },
    {
      "code": 6015,
      "name": "PresaleAlreadyStarted",
      "msg": "Presale already started"
    },
    {
      "code": 6016,
      "name": "ExceedsHardcap",
      "msg": "Exceeds hardcap"
    },
    {
      "code": 6017,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6018,
      "name": "InvalidPresaleIdentifier",
      "msg": "Invalid presale identifier"
    },
    {
      "code": 6019,
      "name": "InvalidTokenAccount",
      "msg": "Invalid token account"
    },
    {
      "code": 6020,
      "name": "InvalidPresaleAuthority",
      "msg": "Invalid presale authority"
    },
    {
      "code": 6021,
      "name": "InvalidVaultOwner",
      "msg": "Invalid vault owner"
    },
    {
      "code": 6022,
      "name": "MissingRequiredSignature",
      "msg": "Missing required signature"
    },
    {
      "code": 6023,
      "name": "PresaleAlreadyDeposited",
      "msg": "Cannot reinitialize presale after tokens have been deposited"
    }
  ]
}