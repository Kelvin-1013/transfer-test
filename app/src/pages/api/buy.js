import connect from '../../lib/mongodb'

export default async function handler(req,res) {
  if(req.method === 'GET') {
    return handleGET(req,res)
  } else if(req.method === 'POST') {
    return handlePOST(req,res)
  } else {
    res.status(405).json({message: 'Method Not Allowed'})
  }
}

async function handleGET(req,res) {
  const {publicKey} = req.query

  if(!publicKey) {
    return res.status(400).json({message: 'Public key is required'})
  }

  try {
    const client = await connect()
    const database = client.db('presale')
    const buys = database.collection('buys')

    const buyerInfo = await buys.findOne({publicKey})

    if(buyerInfo) {
      res.status(200).json({
        buyerCount: buyerInfo.purchases?.length || 0,
        soldAmount: buyerInfo.totalTokenAmount || 0,
        purchases: buyerInfo.purchases || []
      })
    } else {
      res.status(200).json({buyerCount: 0,soldAmount: 0,purchases: []})
    }
  } catch(error) {
    console.error('Error fetching buy information:',error)
    res.status(500).json({message: 'Internal Server Error'})
  }
}

async function handlePOST(req,res) {
  const {publicKey,buyInfo,tokenActivity} = req.body

  if(!publicKey || !buyInfo) {
    return res.status(400).json({message: 'Public key and buy info are required'})
  }

  try {
    const client = await connect()
    const database = client.db('presale')
    const buys = database.collection('buys')

    const newPurchase = {
      presaleIdentifier: buyInfo.presaleIdentifier,
      solAmount: buyInfo.solAmount,
      tokenAmount: buyInfo.tokenAmount,
      signature: buyInfo.signature,
      email: buyInfo.email,
      timestamp: buyInfo.timestamp,
      tokenActivity,
      purchaseDate: new Date()
    }

    const existingBuyer = await buys.findOne({publicKey})

    if(existingBuyer) {
      const result = await buys.updateOne(
        {publicKey},
        {
          $push: {purchases: newPurchase},
          $inc: {totalTokenAmount: buyInfo.tokenAmount || 0},
          $set: {lastUpdated: new Date()}
        }
      )

      if(result.modifiedCount > 0) {
        res.status(200).json({message: 'Buy information updated successfully'})
      } else {
        res.status(400).json({message: 'Failed to update buy information'})
      }
    } else {
      const result = await buys.insertOne({
        publicKey,
        purchases: [newPurchase],
        totalTokenAmount: buyInfo.tokenAmount || 0,
        createdAt: new Date(),
        lastUpdated: new Date()
      })

      if(result.insertedId) {
        res.status(200).json({message: 'Buy information saved successfully'})
      } else {
        res.status(400).json({message: 'Failed to save buy information'})
      }
    }
  } catch(error) {
    console.error('Error saving buy information:',error)
    res.status(500).json({message: 'Internal Server Error'})
  }
}

