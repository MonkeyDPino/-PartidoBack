const mongoose = require('mongoose');
const { Schema } = mongoose;

const infraccionSchema = new Schema({
    fecha:{
        type:String,
        required:true
    },
    motivo:{
        type:String,
        required:true
    }
}, {
    versionKey: false
})

module.exports = mongoose.model('Infraccion', infraccionSchema);