import {MongoClient} from 'mongodb';

const uri = "mongodb+srv://kelvin-1013:jkh57600@cluster0.z54oc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let client = null;
let isConnecting = false;

async function connectToDatabase() {
    if(client && client.topology && client.topology.isConnected()) {
        return client;
    }

    if(isConnecting) {
        while(isConnecting) {
            await new Promise(resolve => setTimeout(resolve,100));
        }
        if(client && client.topology && client.topology.isConnected()) {
            return client;
        }
    }

    try {
        isConnecting = true;
        client = new MongoClient(uri,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        await client.connect();
        console.log("Connected to MongoDB");
        return client;
    } catch(error) {
        console.error("Error connecting to MongoDB:",error);
        throw error;
    } finally {
        isConnecting = false;
    }
}

export default async function handler(req,res) {
    let dbClient;

    try {
        dbClient = await connectToDatabase();
        const db = dbClient.db('presale');
        const collection = db.collection('presaleIdentifiers');

        if(req.method === 'GET') {
            const presaleIdentifier = await collection.findOne({},{sort: {_id: -1}});
            return res.status(200).json(presaleIdentifier ? presaleIdentifier.identifier : null);
        } else if(req.method === 'POST') {
            const {data} = req.body;
            if(!data) {
                return res.status(400).json({error: 'Presale identifier is required'});
            }

            const identifier = JSON.parse(data);

            // Delete all existing documents in the collection
            await collection.deleteMany({});

            // Insert the new identifier
            const result = await collection.insertOne({
                identifier,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            if(result.insertedId) {
                return res.status(201).json({message: 'Presale identifier created successfully'});
            } else {
                return res.status(400).json({message: 'Failed to create presale identifier'});
            }
        } else {
            res.setHeader('Allow',['GET','POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch(error) {
        console.error('Error in presaleIdentifier handler:',error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
}