const router = require('express').Router();
const Cryptojs = require("crypto-js")
const Jugador = require('../models/jugador-model')
const {verifyTokenAndAuth, verifyTokenAndAdmin} = require('../middlewares/verifyToken')

router.get("/",verifyTokenAndAuth,async function(req, res) {
    console.log("llega")
    res.status(200).json("llego")
})



module.exports = router