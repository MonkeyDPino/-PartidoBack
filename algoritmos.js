const Infraccion = require("./models/infraccion-model");
const Jugador = require("./models/jugador-model");
var nodemailer = require('nodemailer');

const ParesImpares = (criterio, jugadores) => {
  criterio == "promedioGlobal"
    ? jugadores.sort(compareGlobal)
    : jugadores.sort(comparelastMatch);

  let equipoA = [],
    equipoB = [];

  let bool = true;

  jugadores.map((jugador) => {
    bool == true
      ? equipoA.push({ id: jugador.id })
      : equipoB.push({ id: jugador.id });
    bool = !bool;
  });
  return {
    equipoA: equipoA,
    equipoB: equipoB,
  }
};

const SegundaOpcion = (criterio, jugadores) => {
  criterio == "promedioGlobal"
    ? jugadores.sort(compareGlobal)
    : jugadores.sort(comparelastMatch);

  let equipoA = [],
    equipoB = [];

  for (let i = 1; i <= 10; i++) {
    [1, 4, 5, 8, 9].includes(i)
      ? equipoA.push({ id: jugadores[i-1].id })
      : equipoB.push({ id: jugadores[i-1].id });
  }

  return {
    equipoA: equipoA,
    equipoB: equipoB,
  };
};

function comparelastMatch(a, b) {
  if (a.promedioLastMatch > b.promedioLastMatch) {
    return -1;
  }
  if (a.promedioLastMatch < b.promedioLastMatch) {
    return 1;
  }
  return 0;
}
function compareGlobal(a, b) {
  if (a.promedioGlobal > b.promedioGlobal) {
    return -1;
  }
  if (a.promedioGlobal < b.promedioGlobal) {
    return 1;
  }
  return 0;
}

function crearInfraccion(Motivo) {
  const infraccion = new Infraccion({
    fecha: new Date(),
    motivo: Motivo,
  });

  return infraccion.save();
}

function anadirInfraccion(idJugador,idinfraccion){
  return Jugador.findByIdAndUpdate(
    idJugador,
    {
      $addToSet: {
        infracciones: { id:idinfraccion },
      },
    },
    { new: true }
  );
}

function sendEmail(asunto,texto,receptor){
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.CORREO_APP,
      pass: process.env.CONTRASENA_APP
    }
  });

  var mailOptions = {
    from: process.env.CORREO_APP,
    to: receptor,
    subject: asunto,
    text: texto
  };

  return transporter.sendMail(mailOptions);
}

async function sendEmailToAllPlayers(asunto,texto){
  let users = await Jugador.find();
  let correos = users.map((user) => {
      return user.correo;
    });
  return sendEmail(asunto,texto,correos);
}

module.exports = {
  ParesImpares,
  SegundaOpcion,
  crearInfraccion,
  anadirInfraccion,
  sendEmail,
  sendEmailToAllPlayers
};
