const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    default: ''
  },
  referrerId: {
    type: String,
    default: ""
  },
  allowed: {
    type: Boolean,
    default: false
  }, 
  changeRate: {
    type: Number,
    default: 0.3
  }
});

const UserModel = mongoose.model('User', userSchema);

async function updateUser(id, params) {
  try {
      const data = await UserModel.findOneAndUpdate({ id: id }, params, {
          new: true, // Return the updated document
          runValidators: true, // Validate the update data against the schema
      });
      return data;
  } catch (error) {
      console.error('Error updating User:', error);
      throw error;
  }
}

async function getUser(id) {
  try {
      const data = await UserModel.findOne({ id: id });
      return data;
  } catch (error) {
      console.error('Error get User:', error);
      throw error;
  }
}

module.exports = {
  UserModel,
  updateUser,
  getUser
};