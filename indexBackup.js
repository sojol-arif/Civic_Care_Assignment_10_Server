const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 3000;

// middleware
// index.js — replace your current cors()
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://assignment-10-62f09.web.app",
        "https://assignment-10-62f09.firebaseapp.com"
    ],
    credentials: true,
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6yzpwvv.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('Smart server is running')
})

// Connection handler
let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
    console.log("MongoDB Connected!");
  }
  return client.db('civic_care');
}

async function run() {
    try {
        await client.connect();

        const db = client.db('civic_care');
        const issuesDb = db.collection('issues');
        const issueContributions = db.collection('contributes');
        const usersCollection = db.collection('users');

        // USERS APIs
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;

            const existingUser = await usersCollection.findOne({ email: email });

            if (existingUser) {
                return res.status(400).send({ message: 'User with this email already exists' });
            } else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }
        })

        // ISSUE APIs
        app.get('/issues', async (req, res) => {
            const emailOne = req.query.email;
            const query = {}
            if (emailOne) {
                query.email = emailOne;
            }

            const cursor = issuesDb.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });

        // Latest APIs
        app.get('/recent-issues', async (req, res) => {
            const cursor = issuesDb.find().sort({ date: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result)
        });

        app.get('/issues/contribute/:issueIdM', async (req, res) => {
            const issueIdParam = req.params.issueIdM;
            const query = { issueId: issueIdParam }
            const cursor = issueContributions.find(query).sort({ bid_price: -1 })
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/issues/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await issuesDb.findOne(query);
            res.send(result);
        });

        app.post('/issues', async (req, res) => {
            const newIssue = req.body;
            const result = await issuesDb.insertOne(newIssue);
            res.send(result);
        })

        app.patch('/issues/:id', async (req, res) => {
            const updatedIssue = req.body;
            const query = { _id: new ObjectId(req.params.id) }
            const update = {
                $set: {
                    title: updatedIssue.title,
                    category: updatedIssue.category,
                    location: updatedIssue.location,
                    description: updatedIssue.description,
                    image: updatedIssue.image,
                    amount: updatedIssue.amount,
                    email: updatedIssue.email,
                    date: updatedIssue.date,
                    status: updatedIssue.status
                }
            }
            const option = {}
            const result = await issuesDb.updateOne(query, update, option)
            res.send(result)
        })

        app.delete('/issues/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await issuesDb.deleteOne(query);
            res.send(result);
        })

        //Contributes
        app.get('/contributes', async (req, res) => {
            const emailOne = req.query.email;
            const query = {};
            if (emailOne) {
                query.email = emailOne;
            }

            const cursor = issueContributions.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/contributes', async (req, res) => {
            const newContribution = req.body;
            const result = await issueContributions.insertOne(newContribution);
            res.send(result);
        })

        app.delete('/contributes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await issueContributions.deleteOne(query);
            res.send(result);
        })

        //Send a ping to confirm a successful connection
        //await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {

    }
}

run().catch(console.dir)

app.listen(port, () => {
    console.log(`Smart server is running on port: ${port}`)
})