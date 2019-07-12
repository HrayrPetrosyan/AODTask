const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

require('dotenv').config();

const regionRoutes = require('./routes/region');
const countryRoutes = require('./routes/country');
const cityRoutes = require('./routes/city');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  next()
})

app.use('/region', regionRoutes);
app.use('/country', countryRoutes);
app.use('/city', cityRoutes);

mongoose.set('useCreateIndex', true);

mongoose.connect(`mongodb+srv://${process.env.DB_PROJECT}:${process.env.DB_PASS}@cluster0-p1nio.mongodb.net/test?retryWrites=true`, {useNewUrlParser: true, useFindAndModify: false})
  .then(result => {
    app.listen("3000");
  })
  .catch(err => {
    console.log(err)
  })
