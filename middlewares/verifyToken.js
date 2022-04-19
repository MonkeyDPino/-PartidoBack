const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.token
    if(authHeader) {
        jwt.verify(authHeader,process.env.JWT_SEC,(err,user) => {
            if(err) {return res.status(403).json("token is not valid")}
            req.user = user
            next()
        })
    }else{
        return res.status(401).json("not verified")
    }
}

const verifyTokenAndAuth =(req,res,next) => {
    verifyToken(req,res,()=>{
        if(req.user.id == req.query.id || req.user.rol == "Administrador"){
            next()
        }else{
            res.status(403).json("not authorized")
        }
    })
}

const verifyTokenAndAdmin =(req,res,next) => {
    verifyToken(req,res,()=>{
        if( req.user.rol == "Administrador"){
            next()
        }else{
            res.status(403).json("not an admin")
        }
    })
}

module.exports = {verifyToken, verifyTokenAndAuth,verifyTokenAndAdmin}