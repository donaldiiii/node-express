const fs = require('fs');
const path = require('path');
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require('./routes/users-routes');
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());
app.use('/uploads/images', express.static('uploads/images'))
//add response header for cors
app.use((req, res, next) => {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Headers', '*');
res.setHeader('Access-Control-Allow-Methods','*');
next();
})

app.use("/api/places", placesRoutes); //only forward requests if path starts like /api/places/ and it serves as default route for the placerouter
app.use("/api/users", usersRoutes);
//if no route is being find simply throw erroros
app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    throw error;
})

app.use((error, req, res, next)=>{ //if it has 4 params then express recognizes as if it has an error
 if(req.file) //multer adds .file prop as part of the request
 {
   fs.unlink(req.file.path, (err) => {
      console.log(err);
   }) //delete the file
 }
 if(res.headerSent == true){ //check if any response was send by router which failed if not we send the error 
    return next(error);
 }
 res.status(error.code || 500).json({
    message: error.message || 'An unknown error occurred!'
 })
});

// End of MiddleWare funnel
const url =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.isib0ya.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
  mongoose.connect(url)
.then(() => {
   app.listen(process.env.PORT || 5000);
}).catch((err)=>{
   console.log(err);
});
