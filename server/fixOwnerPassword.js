require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')

async function fixPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    const hash = await bcrypt.hash('Mohit@123', 10)

    const user = await User.findOne({
      email: 'owner@northlineroofing.com',
    })

    if (!user) {
      console.log('Owner user not found')
      return
    }

    user.passwordHash = hash
    await user.save()

    const match = await bcrypt.compare(
      'Mohit@123',
      user.passwordHash
    )

    console.log('PASSWORD UPDATED:', true)
    console.log('PASSWORD MATCH:', match)
  } catch (error) {
    console.error(error)
  } finally {
    await mongoose.disconnect()
  }
}

fixPassword()