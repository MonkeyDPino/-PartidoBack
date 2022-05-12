const mongoose = require('mongoose');
const { Schema } = mongoose;

const jugadorSchema = new Schema({
    nombre: {
        type: String,
        required: true,
    },
    correo: {
        type: String,
        required: true,
        unique: true
    },
    contrasena: {
        type: String,
        required: true
    },
    promedioGlobal: {
        type: Number,
        required: true,
        default: 5
    },
    promedioLastMatch:{
        type: Number,
        required: true,
        default: 5
    },
    rol:{
        type: String,
        default: 'Jugador',
        enum: ['Administrador', 'Jugador']
    },
    tipo:{
        type:String,
        default: 'Ocasional',
        enum:["Ocasional","Frecuente"]
    },
    infracciones:[
        {
            id:{
                type:String,
                required:true
            }
        }
    ],
    datos:[
        {
            llave:{
                type:String,
                required:true
            },
            valor:{
                type:String,
                required:true
            }
        }
    ],
    calificaciones:[
        {
            num:{
                type:Number,
                required:true
            },
            comentario:{
                type:String,
            },
            fecha:{
                type:String,
                required:true
            }
        }
    ]
}, {
    versionKey: false
});

module.exports = mongoose.model('Jugador', jugadorSchema);