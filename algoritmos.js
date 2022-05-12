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

module.exports = {
  ParesImpares,
  SegundaOpcion
};
