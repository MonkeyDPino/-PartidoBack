const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token;
  if (authHeader) {
    jwt.verify(authHeader, process.env.JWT_SEC, (err, user) => {
      if (err) {
        return res.status(403).json({
          ok: false,
          error: "token is not valid",
        });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({
      ok: false,
      error: "token is not valid",
    });
  }
};

const verifyTokenAndAuth = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id == req.query.id || req.user.rol == "Administrador") {
      next();
    } else {
      res.status(403).json({
        ok: false,
        error: "token is not valid",
      });
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.rol == "Administrador") {
      next();
    } else {
      res.status(403).json({
        ok: false,
        error: "token is not valid",
      });
    }
  });
};

module.exports = { verifyToken, verifyTokenAndAuth, verifyTokenAndAdmin };
