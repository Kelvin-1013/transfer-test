import { NextApiRequest, NextApiResponse } from 'next'
import connect from '../../lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGET(req, res)
  } else if (req.method === 'POST') {
    return handlePOST(req, res)
  } else {
    res.status(405).json({ message: 'Method Not Allowed' })
  }
}

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { publicKey } = req.query

  try {
    const client = await connect()
    const database = client.db('presale')
    const presales = database.collection('presales')

    if (publicKey) {
      const presaleInfo = await presales.findOne({ publicKey })

      if (presaleInfo) {
        res.status(200).json(presaleInfo)
      } else {
        res.status(404).json({ message: 'Presale information not found' })
      }
    } else {
      const allPresales = await presales.find({}).toArray()
      res.status(200).json(allPresales)
    }
  } catch (error) {
    console.error('Error fetching presale information:', error)
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { publicKey, presaleInfo } = req.body;

  if (!publicKey || !presaleInfo) {
    return res.status(400).json({ message: 'Public key and presale info are required' });
  }

  try {
    const client = await connect();
    const database = client.db('presale');
    const presales = database.collection('presales');

    // Find existing presale
    const existingPresale = await presales.findOne({
      'presaleInfo.presaleIdentifier': presaleInfo.presaleIdentifier
    });

    // Prepare the presale info while preserving existing data
    const completePresaleInfo = {
      ...(existingPresale?.presaleInfo || {}), // Keep existing fields
      presaleIdentifier: presaleInfo.presaleIdentifier,
      tokenMintAddress: presaleInfo.tokenMintAddress || existingPresale?.presaleInfo.tokenMintAddress,
      softcapAmount: presaleInfo.softcapAmount || existingPresale?.presaleInfo.softcapAmount,
      hardcapAmount: presaleInfo.hardcapAmount || existingPresale?.presaleInfo.hardcapAmount,
      maxTokenAmountPerAddress: presaleInfo.maxTokenAmountPerAddress || existingPresale?.presaleInfo.maxTokenAmountPerAddress,
      pricePerToken: presaleInfo.pricePerToken || existingPresale?.presaleInfo.pricePerToken,
      startTime: presaleInfo.startTime || existingPresale?.presaleInfo.startTime,
      endTime: presaleInfo.endTime || existingPresale?.presaleInfo.endTime,
      decimals: presaleInfo.decimals || existingPresale?.presaleInfo.decimals,
      depositTokenAmount: presaleInfo.depositTokenAmount,
      soldTokenAmount: presaleInfo.soldTokenAmount || existingPresale?.presaleInfo.soldTokenAmount || 0,
      status: presaleInfo.status || existingPresale?.presaleInfo.status || 'active',
      signature: presaleInfo.signature,
      createdAt: existingPresale?.presaleInfo.createdAt || new Date(),
      updatedAt: new Date()
    };

    let result;
    if (existingPresale) {
      // Update existing presale
      result = await presales.updateOne(
        { 'presaleInfo.presaleIdentifier': presaleInfo.presaleIdentifier },
        {
          $set: {
            publicKey,
            presaleInfo: completePresaleInfo
          }
        }
      );
    } else {
      // Insert new presale
      result = await presales.insertOne({
        publicKey,
        presaleInfo: completePresaleInfo
      });
    }

    if (result.acknowledged) {
      res.status(200).json({ 
        success: true,
        message: existingPresale ? 'Presale information updated successfully' : 'Presale information created successfully',
        operation: existingPresale ? 'updated' : 'created'
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Failed to save presale information' 
      });
    }
  } catch (error) {
    console.error('Error saving presale information:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}