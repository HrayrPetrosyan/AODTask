const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const citySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  timezones: Array,
  isCapital: Boolean,
  country: {
    type: Schema.Types.ObjectId,
    ref: 'Country'
  }
});

module.exports = mongoose.model('City', citySchema);