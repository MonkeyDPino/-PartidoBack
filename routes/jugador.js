const router = require("express").Router();
const Cryptojs = require("crypto-js");
const Jugador = require("../models/jugador-model");
const Partido = require("../models/partido-model");
const {
  verifyTokenAndAuth,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");
const { crearInfraccion, anadirInfraccion } = require("../algoritmos");
const {
  ParesImpares,
  SegundaOpcion,
  sendEmail,
  sendEmailToAllPlayers,
} = require("../algoritmos");

//Actualizar Jugador
router.patch("/", verifyTokenAndAuth, async function (req, res) {
  let user = req.body;
  if (user.contrasena) {
    user.contrasena = Cryptojs.AES.encrypt(
      user.contrasena,
      process.env.PASS_SEC
    ).toString();
  }
  if (user.rol) {
    return res.status(500).json("No se puede cambiar rol");
  }
  if (!req.query.id) {
    return res.status(500).json("No hay ID de usuario");
  }
  try {
    const jugadorActualizado = await Jugador.findByIdAndUpdate(
      req.query.id,
      {
        $set: user,
      },
      { new: true }
    );
    return res.status(200).json(jugadorActualizado);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Actualizar Rol

router.patch("/rol", verifyTokenAndAdmin, async function (req, res) {
  const rol = req.body.rol;
  if (!rol) {
    return res.status(500).json("No hay ROL de usuario");
  }
  if (!req.query.id) {
    return res.status(500).json("No hay ID de usuario");
  }
  try {
    const jugadorActualizado = await Jugador.findByIdAndUpdate(
      req.query.id,
      {
        $set: {
          rol: rol,
        },
      },
      { new: true }
    );
    return res.status(200).json(jugadorActualizado);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Los Jugadores con filtro in

router.patch("/jugadores", verifyTokenAndAuth, async function (req, res) {
  if (req.body.equipoA && req.body.equipoB) {
    try {
      let equipoA = await Jugador.find({
        _id: {
          $in: req.body.equipoA,
        },
      });
      let equipoB = await Jugador.find({
        _id: {
          $in: req.body.equipoB,
        },
      });
      return res.status(200).json({
        equipoB: equipoB,
        equipoA: equipoA
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err,
      });
    }
  } else {
    let filter = {};
    if (req.body.ids) {
      filter.ids = req.body.ids;
    }
    try {
      let users = await Jugador.find({
        _id: {
          $in: filter.ids,
        },
      });
      users = users.map((user) => {
        user.contrasena = "";
        return user;
      });
      return res.status(200).json(users);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err,
      });
    }
  }
});
//Los Jugadores con filtro not in

router.delete("/jugadores", verifyTokenAndAuth, async function (req, res) {
  let filter = {};
  if (req.body.ids) {
    filter.ids = req.body.ids;
  }
  try {
    let users = await Jugador.find({
      _id: {
        $nin: filter.ids,
      },
    });
    users = users.map((user) => {
      user.contrasena = "";
      return user;
    });
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err,
    });
  }
});

//Eliminar Jugador
router.delete("/", verifyTokenAndAdmin, async function (req, res) {
  if (!req.query.id) {
    return res.status(500).json("No hay ID de usuario");
  }
  try {
    await Jugador.findByIdAndDelete(req.query.id);
    res.status(200).json("Usuario eliminado");
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Darse de baja de partido
router.delete("/partido", verifyTokenAndAuth, async function (req, response) {
  const partido = req.body;
  const idJugador = req.query.id;
  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  if (!idJugador) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del jugador",
    });
  }

  try {
    const partidoBuscado = await Partido.findById(partido.id);
    if (partidoBuscado.estado != "EquiposGenerados") {
      return response.status(400).send({
        ok: false,
        error: "El partido no esta en fase de generar equipos",
      });
    }

    let partidoPerteneciente = "",
      equipoA,
      equipoB,
      filter = {},
      retorno = {};

    // Revisar en que equipo esta el jugador
    equipoA = partidoBuscado.equipoA.filter((jugador) => {
      if (jugador.id == idJugador) {
        partidoPerteneciente = "A";
        return false;
      }
      return true;
    });
    if (partidoPerteneciente != "A") {
      equipoB = partidoBuscado.equipoB.filter((jugador) => {
        if (jugador.id == idJugador) {
          partidoPerteneciente = "B";
          return false;
        }
        return true;
      });
    }
    if (partidoPerteneciente == "") {
      return response.status(400).send({
        ok: false,
        error: "Jugador no convocado",
      });
    }
    //Revisar suplente
    if (partido.suplenteId) {
      partidoPerteneciente == "A" && equipoA.push({ id: partido.suplenteId });
      partidoPerteneciente == "B" && equipoB.push({ id: partido.suplenteId });
    } else {
      //Crear infraccion por falta de suplente

      let retornarError = false;
      let Error;
      crearInfraccion("Darse de baja sin asignar un reemplazo")
        .then((result) => {
          retorno.infraccion = result;
          return anadirInfraccion(idJugador, result._id);
        })
        .then((result) => {
          retorno.jugadorPenalizado = result;
        })
        .catch((error) => {
          Error = error;
          retornarError = true;
        });
      if (retornarError)
        return response.status(400).send({
          ok: false,
          error: Error,
        });
    }
    partidoPerteneciente == "A" && (filter.equipoA = equipoA);
    partidoPerteneciente == "B" && (filter.equipoB = equipoB);
    const partidoActualizado = await Partido.findByIdAndUpdate(
      partido.id,
      {
        $set: filter,
      },
      { new: true }
    );
    retorno.partidoActualizado = partidoActualizado;

    //Notificar
    const jugadorAusente = await Jugador.findById(idJugador);
    const notificaciones = await sendEmailToAllPlayers(
      "Un jugador se ha dado de baja en un partido",
      "El Jugador " + jugadorAusente.nombre + " se ha bajado del partido"
    );
    retorno.notificaciones = notificaciones;

    return response.status(200).json(retorno);
  } catch (err) {
    return response.status(500).json(err);
  }
});

//sancionar jugador
router.post("/infraccion", verifyTokenAndAuth, async function (req, response) {
  const body = req.body;
  const idJugador = req.query.id;
  if (!body.motivo) {
    return response.status(400).send({
      ok: false,
      error: "Falta motivo de la infracción",
    });
  }
  if (!idJugador) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del jugador",
    });
  }
  try {
    let retorno = {};
    crearInfraccion(body.motivo)
      .then((result) => {
        retorno.infraccion = result;
        return anadirInfraccion(idJugador, result._id);
      })
      .then((result) => {
        retorno.jugadorPenalizado = result;
        return response.status(200).json(retorno);
      })
      .catch((error) => {
        return response.status(400).send({
          ok: false,
          error: error,
        });
      });
  } catch (err) {
    return response.status(500).json(err);
  }
});

module.exports = router;
