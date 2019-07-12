const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const countrySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  alpha2Code: {
    type: String,
    required: true,
    unique: true
  },
  alpha3Code: {
    type: String,
    required: true,
    unique: true
  },
  population: Number,
  latlng: Array,
  area: Number,
  region: {
    type: Schema.Types.ObjectId,
    ref: 'Region'
  },
  cities: [{
    type: Schema.Types.ObjectId,
    ref: 'City'
  }]
});

module.exports = mongoose.model('Country', countrySchema);