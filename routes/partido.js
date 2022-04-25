const router = require("express").Router();
const Cryptojs = require("crypto-js");
const Partido = require("../models/partido-model");
const {
  verifyTokenAndAuth,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");

//Crear partido
router.post("/", verifyTokenAndAdmin, async function (req, response) {
  let continuar = true;
  const partidos = await Partido.find();

  partidos.map((partido) => {
    if ((partido.estado == "Creado") | (partido.estado == "EquiposGenerados")) {
      continuar = false;
    }
  });

  if (!continuar) {
    return response.status(400).json({
      ok: false,
      error: "Ya hay un partido en juego",
    });
  }

  const partido = req.body;

  if (!partido.fecha) {
    return response.status(400).send({
      ok: false,
      error: "Falta fecha",
    });
  }
  if (!partido.lugar) {
    return response.status(400).send({
      ok: false,
      error: "Falta lugar",
    });
  }
  if (partido.lista || partido.equipoA || partido.equipoB) {
    return response.status(400).send({
      ok: false,
      error: "No se pueden agregar listas",
    });
  }

  const newPartido = new Partido(partido);

  await newPartido.save((err, result) => {
    if (err) return response.status(500).send({ err });
    return response.status(200).send({ result });
  });
});

//Actualizar fecha y/o lugar de partido
router.patch("/", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;
  let filtro = {};
  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  if (!partido.fecha && !partido.lugar) {
    return response.status(400).send({
      ok: false,
      error: "Faltan Parametros",
    });
  }
  if (partido.fecha) {
    filtro.fecha = partido.fecha;
  }
  if (partido.lugar) {
    filtro.lugar = partido.lugar;
  }

  try {
    const partidoActualizado = await Partido.findByIdAndUpdate(
      partido.id,
      {
        $set: filtro,
      },
      { new: true }
    );
    return response.status(200).json(partidoActualizado);
  } catch (err) {
    return response.status(500).json(err);
  }
});

module.exports = router;
