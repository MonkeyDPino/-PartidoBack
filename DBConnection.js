const mongoose = require('mongoose');

mongoose.set('runValidators', true);

const  DBConnection = async()=>{
    await mongoose.connect(process.env.DBCONNECTIONSTRING)
    .then(console.log("DB connection succesfull"))
    .catch(e => console.log("DB connection error ",e))
}

module.exports =  DBConnection