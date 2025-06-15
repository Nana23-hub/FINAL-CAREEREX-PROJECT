const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const routes = require('./Routes/app');
const app = express();
app.use(cors());

const PORT = process.env.PORT || 6500

app.use(express.json());


mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            
            
        });
    });

    app.get("/", (req,res)=>{
        res.status(200).json({message: "Welcome to  My CareerEx Final Project API"});
    })

app.use(routes);

//mongodb+srv://aishatmikailcareerex:<db_password>@cluster0.xz85yj4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//aishatmikailcareerex
//arikeomolara