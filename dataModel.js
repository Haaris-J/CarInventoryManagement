
const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  brand: String,
  model: String,
  type: String,
  fuel: String,
  mileage: String,
  price: String,
  img:
    {
        data: Buffer,
        contentType: String
    }
});

const data = mongoose.model('data', dataSchema);
module.exports = data;
