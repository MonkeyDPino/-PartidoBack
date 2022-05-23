const express = require('express');
require('dotenv').config()
const cors = require('cors')
const DBConnection =require("./DBConnection.js")

const authRoute = require("./routes/auth")
const jugadorRoute = require("./routes/jugador")
const partidoRoute = require("./routes/partido")

const app = express();

app.use(express.json())
app.use(cors())
app.use("/api/auth",authRoute)
app.use("/api/jugador",jugadorRoute)
app.use("/api/partido",partidoRoute)

app.listen({port: process.env.PORT || 5000},async()=>{
    await DBConnection()
    console.log('listening on port 5000')
})