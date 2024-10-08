import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser'

dotenv.config();
const app = express();
app.set('view-engine','ejs')
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URL);
const connectDB = async () => {
  try {
    await client.connect();
    console.log("Database connection successful.");
  } catch (err) {
    console.error("Database connection failed: ", err);
  }
};
connectDB();

const db = client.db('IIIT_Kota_Backend');
const usersCollection = db.collection('users');

// JWT Authentication
const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.sendStatus(403);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Login route
app.get('/login',(req,res)=>{
  res.render('login.ejs')
})


// Admin Route
app.post('/', async (req, res) => {
  const { username, password } = req.body;
  const user = await usersCollection.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.sendStatus(403); 
  }
  const token = jwt.sign({ username: user.username, role: user.role }, process.env.ACCESS_TOKEN_SECRET);
  console.log("token : ",token)
  res.render('index.ejs',{token});
});

// ADD ROUTES

// ANNOUNCEMENT
app.post('/announcement', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
    return res.sendStatus(403);
  }
  const { title, description, date, link } = req.body;
  try {
    const newAnnouncement = { title, description, date, link };
    await db.collection('announcements').insertOne(newAnnouncement);
    res.status(201).json({ message: 'Announcement created.' });
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ message: 'Error' });
  }
});

// EVENT
app.post('/event', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'Super Admin') {
    return res.sendStatus(403);
  }
  const { title, description, imageurl, date } = req.body;
  try {
    const newEvent = { title, description, imageurl, date };
    await db.collection('events').insertOne(newEvent);
    res.status(201).json({ message: 'Event created.' });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Error' });
  }
});


// UPDATE ROUTES
// ANNOUNCEMENT
app.put('/announcement/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
    return res.sendStatus(403);
  }
  const {id} = req.params
  const { title, description, date, link } = req.body;
  await db.collection('announcements').updateOne(
    { _id: new ObjectId(id) }, 
    { $set: { title, description, date, link } }
  );
  res.status(200).json({ message: 'Announcement updated.' });
});

// EVENT
app.put('/event/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'Super Admin') {
    return res.sendStatus(403);
  }
  const {id} = req.params
  const { title, description, imageurl, date } = req.body;
  await db.collection('events').updateOne(
    { _id: new ObjectId(id) }, 
    { $set: { title, description, imageurl, date } }
  );
  res.status(200).json({ message: 'Event updated.' });
});



// DELETE ROUTES
// ANNOUNCEMENT
app.delete('/announcement/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
    return res.sendStatus(403);
  }
  const { id } = req.params;
  await db.collection('announcements').deleteOne({ _id: new ObjectId(id) });
  res.status(200).json({ message: 'Announcement deleted.' });
});

// EVENT
app.delete('/event/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'Super Admin') {
    return res.sendStatus(403);
  }
  const { id } = req.params;
  await db.collection('events').deleteOne({ _id: new ObjectId(id) });
  res.status(200).json({ message: 'Event deleted.' });
});



// FETCH ROUTES
// ANNOUNCEMENT
app.get('/announcement', async (req, res) => {
  const announcements = await db.collection('announcements').find().toArray();
  res.status(200).json(announcements);
});

// EVENT
app.get('/event', async (req, res) => {
  const events = await db.collection('events').find().toArray();
  res.status(200).json(events);
});



app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
