const express = require('express');
require('dotenv').config()
const DBConnection =require("./DBConnection.js")


const app = express();

app.use(express.json())

app.listen({port: process.env.PORT || 5000},async()=>{
    await DBConnection()
    console.log('listening on port 5000')
})