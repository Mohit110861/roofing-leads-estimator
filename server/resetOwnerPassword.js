require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    const user = await User.findOne({
      email: 'owner@northlineroofing.com',
    })

    if (!user) {
      console.log('Owner user not found')
      process.exit(1)
    }

    user.passwordHash = await User.hashPassword('Northline@2026')
    await user.save()

    console.log('Owner password reset successfully')
    console.log('Email: owner@northlineroofing.com')
    console.log('Password: Mohit@123')

    await mongoose.disconnect()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

resetPassword()