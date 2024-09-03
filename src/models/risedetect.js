const mongoose = require('mongoose');

const riseDetectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    default: ''
  }
});

const RiseDetect = mongoose.model('RiseDetect', riseDetectSchema);


module.exports = RiseDetect;