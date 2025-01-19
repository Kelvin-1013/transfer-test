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
  try {
    const client = await connect();
    const database = client.db('presale');
    const currentPresale = database.collection('current_presale');
    const presales = database.collection('presales');

    const currentPresaleData = await currentPresale.findOne({});
    
    if (!currentPresaleData) {
      return res.status(404).json({ 
        message: 'No current presale found',
        success: false 
      });
    }

    // Get full presale info from presales collection
    const presaleInfo = await presales.findOne({
      'presaleInfo.presaleIdentifier': currentPresaleData.presaleInfo.presaleIdentifier
    });

    if (!presaleInfo) {
      return res.status(404).json({
        message: 'Presale information not found',
        success: false
      });
    }

    res.status(200).json({
      success: true,
      presaleInfo: presaleInfo.presaleInfo
    });
  } catch (error) {
    console.error('Error fetching current presale:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { presaleIdentifier, depositTokenAmount, soldTokenAmount, withdrawAmount, withdrawType, receivedSolAmount } = req.body;

  if (presaleIdentifier === undefined || presaleIdentifier === null) {
    return res.status(400).json({ message: 'Presale identifier is required' });
  }

  try {
    const client = await connect();
    const database = client.db('presale');
    const currentPresale = database.collection('current_presale');
    const presales = database.collection('presales');

    // Get the full presale info from presales collection
    const presaleInfo = await presales.findOne({
      'presaleInfo.presaleIdentifier': Number(presaleIdentifier)
    });

    if (!presaleInfo) {
      return res.status(404).json({
        success: false,
        message: 'Presale not found'
      });
    }
    // Delete existing current presale document
    await currentPresale.deleteMany({});
    // Create new current presale document with updated values
    const updatedPresaleInfo = {
      ...presaleInfo.presaleInfo,
      depositTokenAmount: depositTokenAmount !== undefined 
        ? (presaleInfo.presaleInfo.depositTokenAmount || 0) + depositTokenAmount
        : presaleInfo.presaleInfo.depositTokenAmount || 0,
      soldTokenAmount: soldTokenAmount !== undefined
        ? (presaleInfo.presaleInfo.soldTokenAmount || 0) + soldTokenAmount
        : presaleInfo.presaleInfo.soldTokenAmount || 0,
      receivedSolAmount: receivedSolAmount !== undefined
        ? (presaleInfo.presaleInfo.receivedSolAmount || 0) + receivedSolAmount
        : presaleInfo.presaleInfo.receivedSolAmount || 0
    };
    // Handle withdrawals
    if (withdrawAmount !== undefined && withdrawType) {
      if (withdrawType === 'Token') {
        updatedPresaleInfo.depositTokenAmount = Math.max(
          0, 
          (updatedPresaleInfo.depositTokenAmount || 0) - withdrawAmount
        );
      } else if (withdrawType === 'Sol') {
        updatedPresaleInfo.receivedSolAmount = Math.max(
          0, 
          (updatedPresaleInfo.receivedSolAmount || 0) - withdrawAmount
        );
      }
    }
    const result = await currentPresale.insertOne({
      presaleInfo: updatedPresaleInfo,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    // Update the presales collection with the same values
    await presales.updateOne(
      { 'presaleInfo.presaleIdentifier': Number(presaleIdentifier) },
      {
        $set: {
          'presaleInfo.depositTokenAmount': updatedPresaleInfo.depositTokenAmount,
          'presaleInfo.soldTokenAmount': updatedPresaleInfo.soldTokenAmount,
          'presaleInfo.receivedSolAmount': updatedPresaleInfo.receivedSolAmount,
          'presaleInfo.updatedAt': new Date()
        }
      }
    );

    if (result.acknowledged) {
      res.status(200).json({ 
        success: true,
        message: 'Current presale updated successfully'
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Failed to update current presale' 
      });
    }
  } catch (error) {
    console.error('Error updating current presale:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

