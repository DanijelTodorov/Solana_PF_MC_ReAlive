const mongoose = require('mongoose');

const followDetectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    default: ''
  }
});

const FollowDetect = mongoose.model('FollowDetect', followDetectSchema);


module.exports = FollowDetect;