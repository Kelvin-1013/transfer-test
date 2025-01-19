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

  if (!publicKey) {
    return res.status(400).json({ message: 'Public key is required' })
  }

  try {
    const client = await connect()
    // const database = client.db('presale')
    const database = client.db('presale')
    const activities = database.collection('token_activities')

    const tokenActivities = await activities.find({ publicKey }).toArray()

    res.status(200).json(tokenActivities)
  } catch (error) {
    console.error('Error fetching token activities:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { publicKey, activity } = req.body

  if (!publicKey || !activity) {
    return res.status(400).json({ message: 'Public key and activity info are required' })
  }

  try {
    const client = await connect()
    // const database = client.db('presale')
    const database = client.db('presale')
    const activities = database.collection('token_activities')

    const result = await activities.insertOne({
      publicKey,
      ...activity,
      createdAt: new Date()
    })

    if (result.insertedId) {
      res.status(200).json({ message: 'Token activity saved successfully' })
    } else {
      res.status(400).json({ message: 'Failed to save token activity' })
    }
  } catch (error) {
    console.error('Error saving token activity:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}