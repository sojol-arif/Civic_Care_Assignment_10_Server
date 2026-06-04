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

// ✅ connectDB — only this, no run()
let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
    console.log("MongoDB Connected!");
  }
  return client.db('civic_care');
}

app.get('/', (req, res) => {
  res.send('Smart server is running');
});

// ── USERS ──
app.get('/users', async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('users').find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const db = await connectDB();
    const existingUser = await db.collection('users')
      .findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' });
    }
    const result = await db.collection('users').insertOne(req.body);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// ── ISSUES ──

// ✅ 1. /issues
app.get('/issues', async (req, res) => {
  try {
    const db    = await connectDB();
    const query = {};
    if (req.query.email) query.email = req.query.email;
    const result = await db.collection('issues').find(query).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// ✅ 2. /recent-issues
app.get('/recent-issues', async (req, res) => {
  try {
    const db     = await connectDB();
    const result = await db.collection('issues')
      .find()
      .sort({ date: -1 })
      .limit(6)
      .toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// ✅ 3. /issues/contribute — BEFORE :id
app.get('/issues/contribute/:issueIdM', async (req, res) => {
  try {
    const db     = await connectDB();
    const result = await db.collection('contributes')
      .find({ issueId: req.params.issueIdM })
      .toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// ✅ 4. /issues/:id — LAST
app.get('/issues/:id', async (req, res) => {
  try {
    const db     = await connectDB();
    const result = await db.collection('issues')
      .findOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: 'Invalid ID' });
  }
});

app.post('/issues', async (req, res) => {
  try {
    const db     = await connectDB();
    const result = await db.collection('issues').insertOne(req.body);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.patch('/issues/:id', async (req, res) => {
  try {
    const db           = await connectDB();
    const updatedIssue = req.body;
    delete updatedIssue._id;
    const result = await db.collection('issues').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedIssue }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.delete('/issues/:id', async (req, res) => {
  try {
    const db     = await connectDB();
    const result = await db.collection('issues')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// ── CONTRIBUTES ──
app.get('/contributes', async (req, res) => {
  try {
    const db    = await connectDB();
    const query = {};
    if (req.query.email) query.email = req.query.email;
    const result = await db.collection('contributes').find(query).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.post('/contributes', async (req, res) => {
  try {
    const db     = await connectDB();
    const result = await db.collection('contributes').insertOne(req.body);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.delete('/contributes/:id', async (req, res) => {
  try {
    const db     = await connectDB();
    const result = await db.collection('contributes')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});