const router = require("express").Router();
const Cryptojs = require("crypto-js");
const Jugador = require("../models/jugador-model");
const {
  verifyTokenAndAuth,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");

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

// router.delete("/",verifyTokenAndAdmin,async function(req, res){
//     if(!req.query.id){
//         return res.status(500).json("No hay ID de usuario");
//     }
//     try{
//         await Jugador.findByIdAndDelete(req.query.id)
//         res.status(200).json("Usuario eliminado")
//     }catch (err) {
//         return res.status(500).json(err)
//     }
// })

module.exports = router;
