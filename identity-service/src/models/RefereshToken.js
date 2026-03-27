const mongoose= require('mongoose');

const RefreshTokenSchema= new mongoose.Schema({
    user:{// Reference to the user associated with this refresh token
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'},
    token:{ // The actual refresh token string
        type: String,
        required: true,
        unique: true
    },
    expiresAt:{// The expiration date of the refresh token
        type: Date,
        required: true
    },
  

},{
    timestamps: true
})
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // This index will automatically remove expired tokens from the database
const RefreshToken= mongoose.model('RefreshToken', RefreshTokenSchema)
module.exports= RefreshToken