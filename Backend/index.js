import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

dotenv.config();
const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URL);
const connectDB = async () => {
    try {
        await client.connect();
        console.log("Database connnection successful.");
    } catch (err) {
        console.error("Database Connection failed : ", err);
    }
};
connectDB();

app.get('/announcement', async (req, res) => {
    try {
        const database = client.db('IIIT_Kota_Backend'); 
        const collection = database.collection('announcements'); 
        const announcements = await collection.find({}).toArray();

        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }
        res.status(200).json(announcements); 
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Error fetching announcements', error: error.message });
    }
});

app.get('/event',async(req,res)=>{
    try{
        const database = client.db('IIIT_Kota_Backend')
        const collection = database.collection('events')
        const events = await collection.find({}).toArray();
        if (events.length === 0) {
            return res.status(404).json({ message: 'No events found' });
        }   
        res.status(200).json(events); 
    }catch(error){
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Error fetching announcements', error: error.message });
    }
})


const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
