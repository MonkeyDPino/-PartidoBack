const router = require('express').Router();
const Jugador = require('../models/jugador-model')
const Cryptojs = require("crypto-js")
const jwt = require('jsonwebtoken')
const axios = require('axios');
const AbstractApiKey = process.env.ABSTRACT_API_KEY


//register
router.post("/register", async function (req, response) {
  const user = req.body;

  if (!user.nombre) {
    return response.status(400).send({
      ok: false,
      error: "Falta nombre",
    });
  }
  if (!user.correo) {
    return response.status(400).send({
      ok: false,
      error: "Falta correo",
    });
  }
  if (!user.contrasena) {
    return response.status(400).send({
      ok: false,
      error: "Falta contrasena",
    });
  }

  const { contrasena, ...others } = user;

  const newJugador = new Jugador({
    ...others,
    contrasena: Cryptojs.AES.encrypt(
      user.contrasena,
      process.env.PASS_SEC
    ).toString(),
  });

  //Verficación de correo
  axios.get(
    "https://emailvalidation.abstractapi.com/v1/?api_key=" +
      AbstractApiKey +
      "&email=" +
      user.correo
  )
  .then(async (res) => {
    if (res.data.deliverability != "DELIVERABLE"){
      return response.status(400).send({
        ok: false,
        error: "correo no válido",
      });
    }else{
      //crear jugador
      await newJugador.save((error, result) => {
        if (error) {
          return response.status(500).send({
            ok: false,
            error: error,
          });
        }
        return response.send(result);
      });
    } 
  })
  .catch((error) => {
    return response.status(400).send({
      ok: false,
      error: error,
    });
  });

  
});

router.post("/login",async (req, response) => {
    try{
        const user = await Jugador.findOne({ correo: req.body.correo });
      !user &&
        response.status(401).send({
          ok: false,
          error: "El Usuario no existe",
        });
        

      const Pass = Cryptojs.AES.decrypt(
        user.contrasena,
        process.env.PASS_SEC
      ).toString(Cryptojs.enc.Utf8);

      Pass !== req.body.contrasena &&
        response.status(401).send({
          ok: false,
          error: "Malas Credenciales",
        });

      const accessToken = jwt.sign(
        {
          id: user._id,
          rol: user.rol,
        },
        process.env.JWT_SEC,
        { expiresIn: "1d" }
      );

      const { contrasena, ...others } = user._doc;

      response.status(200).json({ ...others, accessToken });
    }catch(err){
      return response.status(500).send({
        ok: false,
        error: err,
      });
    }
      
    
    

})

module.exports = router