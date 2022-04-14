const mongoose = require('mongoose');
const { Schema } = mongoose;

const partidoSchema = new Schema({
    fecha:{
        type:String,
        required:true
    },
    lugar:{
        type:String,
        required:true
    },
    estado:{
        type:String,
        default:"Creado",
        enum:["Creado","EquiposGenerados","Confirmado","Cancelado"]
    },
    lista:[
        {
            id:{
                type:String,
                required:true
            }
        }
    ],
    equipoA:[
        {
            id:{
                type:String,
                required:true
            }
        }
    ],
    equipoB:[
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
    ]
}, {
    versionKey: false
})

module.exports = mongoose.model('Partido', partidoSchema);