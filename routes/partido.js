const router = require("express").Router();
const Cryptojs = require("crypto-js");
const Partido = require("../models/partido-model");
const Jugador = require("../models/jugador-model");
const {
  verifyTokenAndAuth,
  verifyTokenAndAdmin,
  verifyToken,
} = require("../middlewares/verifyToken");
const {
  ParesImpares,
  SegundaOpcion,
  sendEmail,
  sendEmailToAllPlayers,
} = require("../algoritmos");

//Crear partido
router.post("/", verifyTokenAndAdmin, async function (req, response) {
  try {
    let continuar = true;
    const partidos = await Partido.find();

    partidos.map((partido) => {
      if (partido.estado == "Creado" || partido.estado == "EquiposGenerados") {
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
    let retorno = {};
    await newPartido.save(async (err, result) => {
      if (err)
        return response.status(500).send({
          ok: false,
          error: err,
        });
      retorno.partido = result;
      const notificaciones = await sendEmailToAllPlayers(
        "Creación de partido",
        "El administrador ha creado un nuevo partido ¡Atento pues!"
      );
      retorno.notificaciones = notificaciones;
      return response.status(200).send(retorno);
    });
  } catch (err) {
    return response.status(500).json({
      ok: false,
      error: err,
    });
  }
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

//Agregar dato a partido
router.post("/dato", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;
  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  if (!partido.llave) {
    return response.status(400).send({
      ok: false,
      error: "Falta llave de dato",
    });
  }
  if (!partido.valor) {
    return response.status(400).send({
      ok: false,
      error: "Falta valor de dato",
    });
  }
  try {
    const partidoActualizado = await Partido.updateOne(
      { _id: partido.id },
      {
        $addToSet: {
          datos: { llave: partido.llave, valor: partido.valor },
        },
      },
      { new: true }
    );
    return response.status(200).json(partidoActualizado);
  } catch (err) {
    return response.status(500).json({
      ok: false,
      error: err,
    });
  }
});

//modificar dato de partido

router.delete("/dato", verifyTokenAndAdmin, async function (req, response) {
  const cuerpo = req.body;
  if (!cuerpo.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  if (!cuerpo.idDatos || cuerpo.idDatos.length === 0) {
    return response.status(400).send({
      ok: false,
      error: "Faltan ids de datos",
    });
  }
  try {
    const partidoActualizado = await Partido.findByIdAndUpdate(
      cuerpo.id,
      {
        $pull: {
          datos: { _id: cuerpo.idDatos },
        },
      },
      { new: true }
    );
    return response.status(200).json(partidoActualizado);
  } catch (err) {
    return response.status(500).json({
      ok: false,
      error: err,
    });
  }
});

//confirmar partido
router.patch("/confirmar", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;
  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  try {
    let retorno = {};
    const partidoActualizado = await Partido.findByIdAndUpdate(
      partido.id,
      {
        $set: {
          estado: "Confirmado",
        },
      },
      { new: true }
    );
    retorno.partidoActualizado = partidoActualizado;
    const notificaciones = await sendEmailToAllPlayers(
      "Partido Confirmado",
      "El administrador ha confirmado un partido"
    );
    retorno.notificaciones = notificaciones;
    return response.status(200).json(retorno);
  } catch (err) {
    return response.status(500).json({
      ok: false,
      error: err,
    });
  }
});

//partidos
router.get("/", verifyToken, async (req, res) => {
  try {
    const partidos = await Partido.find();

    return res.status(200).json(partidos);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err,
    });
  }
});

//partido
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const partido = await Partido.findOne({ _id: req.params.id });
    return res.status(200).json(partido);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//Cancelar partido
router.delete("/", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;
  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  try {
    const partidoActualizado = await Partido.findByIdAndUpdate(
      partido.id,
      {
        $set: {
          estado: "Cancelado",
        },
      },
      { new: true }
    );
    return response.status(200).json(partidoActualizado);
  } catch (err) {
    return response.status(500).json({
      ok: false,
      error: err,
    });
  }
});

//Crear lista de participantes
router.post("/lista", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;
  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  try {
    const users = await Jugador.find();
    const usersId = [];
    users.map((user) => {
      if (user.tipo == "Frecuente") {
        usersId.push({
          id: user._id.toString(),
        });
      }
    });
    const partidoActualizado = await Partido.findByIdAndUpdate(
      partido.id,
      {
        $set: {
          lista: usersId,
          equipoA: [],
          equipoB: [],
        },
      },
      { new: true }
    );
    return response
      .status(200)
      .json({ partidoActualizado: partidoActualizado });
  } catch (e) {
    return response.status(500).json(err);
  }
});

//Quitar jugador de lista
router.delete(
  "/lista/:id",
  verifyTokenAndAdmin,
  async function (req, response) {
    const partido = req.body;
    const jugadorId = req.params.id;

    if (!partido.id) {
      return response.status(400).send({
        ok: false,
        error: "Falta id del partido",
      });
    }
    if (!jugadorId) {
      return response.status(400).send({
        ok: false,
        error: "Falta id del jugador",
      });
    }
    try {
      const partidoBuscado = await Partido.findById(partido.id);

      const listaNueva = partidoBuscado.lista.filter(
        (jugador) => jugador.id != jugadorId
      );

      const partidoActualizado = await Partido.findByIdAndUpdate(partido.id, {
        $set: {
          lista: listaNueva,
          equipoA: [],
          equipoB: [],
          estado:"Creado"
        },
      });
      return response.status(200).json(partidoActualizado);
    } catch (err) {
      return response.status(500).send({
        ok: false,
        error: err,
      });
    }
  }
);

//agregar jugador a lista
router.patch("/lista/:id", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;
  const jugadorId = req.params.id;

  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  if (!jugadorId) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del jugador",
    });
  }
  try {
    const partidoBuscado = await Partido.findById(partido.id);
    if (partidoBuscado.lista.length >= 10) {
      return response.status(400).json({
        ok: false,
        error: "la lista ya tiene 10 jugadores",
      });
    }

    let continuar = true;
    partidoBuscado.lista.map((jugador) => {
      if (jugador.id === jugadorId) continuar = false;
    });

    if (!continuar) {
      return response.status(400).json({
        ok: false,
        error: "Ya esta el jugador en la lista",
      });
    }

    const partidoActualizado = await Partido.findByIdAndUpdate(partido.id, {
      $addToSet: {
        lista: { id: jugadorId },
      },
      $set: {
        equipoA: [],
        equipoB: [],
        estado:"Creado"
      },
    });
    return response.status(200).json(partidoActualizado);
  } catch (err) {
    return response.status(500).send({
      ok: false,
      error: err,
    });
  }
});

//crear equipos
router.post("/equipos", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;
  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }

  if (
    !partido.criterio ||
    !["promedioGlobal", "promedioLastMatch"].includes(partido.criterio)
  ) {
    return response.status(400).send({
      ok: false,
      error: "criterio no válido",
    });
  }

  if (
    !partido.algoritmo ||
    !["ParesImpares", "SegundaOpcion"].includes(partido.algoritmo)
  ) {
    return response.status(400).send({
      ok: false,
      error: "algoritmo no válido",
    });
  }

  try {
    const partidoBuscado = await Partido.findById(partido.id);
    if (partidoBuscado.lista.length != 10) {
      return response.status(400).send({
        ok: false,
        error: "lista incompleta",
      });
    }
    const lista = partidoBuscado.lista.map((doc) => {
      return doc.id;
    });

    const jugadores = await Jugador.find({ _id: { $in: lista } });

    const equipos =
      partido.algoritmo == "ParesImpares"
        ? ParesImpares(partido.criterio, jugadores)
        : SegundaOpcion(partido.criterio, jugadores);

    equipos.estado = "EquiposGenerados";

    const partidoActualizado = await Partido.findByIdAndUpdate(
      partido.id,
      {
        $set: equipos,
      },
      { new: true }
    );

    await sendEmailToAllPlayers(
      "Equipos generados",
      "El administrador ha generado los equipos ¡Atento pues! puede que estés en algún equipo"
    );

    return response.status(200).json(partidoActualizado);
  } catch (err) {
    return response.status(500).send({
      ok: false,
      error: err,
    });
  }
});

//Cambiar jugadores de equipo
router.patch("/equipos", verifyTokenAndAdmin, async function (req, response) {
  const partido = req.body;
  if (!partido.id) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  if (!partido.idJugador1) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del jugador",
    });
  }
  if (!partido.idJugador2) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del jugador",
    });
  }

  try {
    const partidoBuscado = await Partido.findById(partido.id);

    if (partidoBuscado.lista.length != 10) {
      return response.status(400).send({
        ok: false,
        error: "La lista está incompleta",
      });
    }
    let equipoA = [],
      equipoB = [];
    for (let i = 0; i <= 4; i++) {
      equipoA.push(partidoBuscado.equipoA[i].id);
      equipoB.push(partidoBuscado.equipoB[i].id);
    }

    if (
      equipoB.includes(partido.idJugador1) ||
      equipoA.includes(partido.idJugador2)
    ) {
      return response.status(400).send({
        ok: false,
        error: "El jugador ya esta en ese equipo",
      });
    }
    if (
      !equipoB.includes(partido.idJugador2) ||
      !equipoA.includes(partido.idJugador1)
    ) {
      return response.status(400).send({
        ok: false,
        error: "El jugador no esta en ese equipo",
      });
    }

    equipoA = partidoBuscado.equipoA.filter(
      (jugador) => jugador.id != partido.idJugador1
    );
    equipoB = partidoBuscado.equipoB.filter(
      (jugador) => jugador.id != partido.idJugador2
    );
    equipoA.push({
      id: partido.idJugador2,
    });
    equipoB.push({
      id: partido.idJugador1,
    });

    const partidoActualizado = await Partido.findByIdAndUpdate(
      partido.id,
      {
        $set: {
          equipoA,
          equipoB,
        },
      },
      { new: true }
    );
    return response.status(200).json(partidoActualizado);
  } catch (err) {
    return response.status(500).send({
      ok: false,
      error: err,
    });
  }
});

//calificar jugador
router.post("/calificaciones", verifyToken, async function (req, response) {
  const partido = req.body;
  if (!partido.idPartido) {
    return response.status(400).send({
      ok: false,
      error: "Falta id del partido",
    });
  }
  if (!partido.calificacion) {
    return response.status(400).send({
      ok: false,
      error: "Faltan la calificacion del partido",
    });
  }
  if (!partido.idJugador) {
    return response.status(400).send({
      ok: false,
      error: "Faltan el id del jugador",
    });
  }
  if (!partido.idCalificador) {
    return response.status(400).send({
      ok: false,
      error: "Faltan el id del calificador",
    });
  }
  try {
    let user = await Jugador.findById(partido.idJugador);
    let nota = parseFloat(partido.calificacion);
    user.calificaciones.map((cal) => {
      nota += parseFloat(cal.num);
    });
    console.log(nota, user.calificaciones.length);
    nota = nota / (user.calificaciones.length + 1);
    console.log(nota, user.calificaciones.length);

    const JugadorActualizado = await Jugador.findByIdAndUpdate(
      partido.idJugador,
      {
        $addToSet: {
          calificaciones: {
            num: partido.calificacion,
            comentario: partido.comentario ? partido.comentario : "",
            fecha: new Date(),
            idJugador: partido.idCalificador,
            idPartido: partido.idPartido,
          },
        },
        $set: {
          promedioGlobal: nota,
        },
      },
      { new: true }
    );
    console.log(JugadorActualizado);
    return response.status(200).json(JugadorActualizado);
  } catch (err) {
    return response.status(500).send({
      ok: false,
      error: err,
    });
  }
});

//partidos en los que está un jugador
router.get("/partido/:id", verifyToken, async function (req, res) {
  const jugadorId = req.params.id;
  try {
    const partidos = await Partido.find({
      estado: "Confirmado",
      lista: {
        $elemMatch: {
          id: jugadorId,
        },
      },
    });

    //jugadores necesitados por la base de datos
    const PlayersNeeded = [];
    //partidos y sus respectivos jugadores
    const partidoIds = {};

    partidos.map((part) => {
      //lista de jugadores necesitados por el partido
      let idPlayersPartidos = [];

      part.lista.map((user) => {
        //agregar a lista de necesitados por la base de datos
        if (user.id != jugadorId && !PlayersNeeded.includes(user.id))
          PlayersNeeded.push(user.id);
        //agregar a lista de necesitados por el partido
        if (user.id != jugadorId) idPlayersPartidos.push(user.id);
      });
      partidoIds[part._id] = idPlayersPartidos;
      return;
    });

    // console.log("PlayersNeeded", PlayersNeeded, "partidoIds", partidoIds);

    //sacar jugadores necesitados
    let users = await Jugador.find({
      _id: {
        $in: PlayersNeeded,
      },
    });

    //respuesta con partidos y sus respectivos jugadores
    let respuesta = [];

    partidos.map((part) => {
      filtroRespuesta = {};
      filtroRespuesta.partido = part;
      jugadores = [];

      //recorrer usuarios para agregarlos al partido
      users.map((user) => {
        if (!partidoIds[part._id].includes(user._id.toString())) return;
        let BOOL = true;
        //REVISAR SI EL JUGADOR YA HA SIDO CALIDICADO ANTERIORMENTE POR MI JUGADOR EN ESE MISMO PARTIDO
        user.calificaciones.map((cal) => {
          if (cal.idPartido == part._id && cal.idJugador == jugadorId) {
            BOOL = false;
          }
          return;
        });
        //lo meto en los jugadores
        if (BOOL) jugadores.push(user);
        return;
      });
      filtroRespuesta.jugadores = jugadores;
      filtroRespuesta.jugadores.length > 0
        ? respuesta.push(filtroRespuesta)
        : jugadores;
    });

    return res.status(200).json(respuesta);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err,
    });
  }
});

//partido para darse de baja
router.get("/baja/:id", verifyToken, async function (req, response) {
  const jugadorId = req.params.id;
  // try {
    let respuesta = {};
    const partido = await Partido.findOne({
      estado: "EquiposGenerados",
      lista: {
        $elemMatch: {
          id: jugadorId,
        },
      },
      // $or: [
      //   {
      //     equipoA: {
      //       $elemMatch: {
      //         id: jugadorId,
      //       },
      //     },
      //     equipoB: {
      //       $elemMatch: {
      //         id: jugadorId,
      //       },
      //     },
      //   },
      // ],
    });
    if (partido != null) {
      respuesta.partido = partido;
      const ids = [];
      partido.lista.map((user) => {
        ids.push(user.id);
      });
      let users = await Jugador.find({
        _id: {
          $nin: ids,
        },
      });
      respuesta.jugadores = users;

      return response.status(200).json(respuesta);
    }
    return response.status(500).json({
      ok: false,
      error: "no hay partidos para darse de baja",
    });
  // } catch (err) {
  //   return response.status(500).send({
  //     ok: false,
  //     error: err,
  //   });
  // }
});

module.exports = router;
