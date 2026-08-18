const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ['owner', 'admin'], default: 'owner' },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (plainText) {
  return bcrypt.compare(plainText, this.passwordHash);
};

UserSchema.statics.hashPassword = function (plainText) {
  return bcrypt.hash(plainText, 10);
};

module.exports = mongoose.model('User', UserSchema);
