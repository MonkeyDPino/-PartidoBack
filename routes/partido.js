const router = require("express").Router();
const Cryptojs = require("crypto-js");
const Partido = require("../models/partido-model");
const {
  verifyTokenAndAuth,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");

//Crear partido
router.post("/", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;

  if (!partido.fecha) {
    return response.status(400).send({
      ok: false,
      error: "Falta fecha",
    });
  }
  if(!partido.lugar){
    return response.status(400).send({
        ok: false,
        error: "Falta lugar",
      });
  }
  if(partido.lista || partido.equipoA || partido.equipoB){
    return response.status(400).send({
        ok: false,
        error: "No se pueden agregar listas",
      });
  }

  const newPartido = new Partido(partido)

  await newPartido.save((err, result) => {
      if(err) return response.status(500).send({err})
      return response.status(200).send({result})
  })

});

module.exports = router;
