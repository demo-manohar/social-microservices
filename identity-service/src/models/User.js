const mongoose = require("mongoose");
const argon2 = require("argon2"); // used for string password hashing

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const hashedPassword = await argon2.hash(this.password);
  this.password = hashedPassword;
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);   
    } catch (error) {
        throw error;
    }
};
userSchema.index({ username: 1, email: 1 }, { unique: true });// Compound index to ensure unique username and email combination
userSchema.index({ createdAt: 1 }); // Index on createdAt for faster queries based on creation date
userSchema.index({username:'text'}) // Text index on username for efficient search by username 
//how indixing helps  userSchema.index({username:'text'}) is used to create a text index on the username field in the userSchema. 
// This allows for efficient searching of users based on their username. When you perform a search query using the $text operator,
//  MongoDB can quickly locate the relevant documents using the text index, improving the performance of search operations on the username field.
const User = mongoose.model("User", userSchema);
module.exports = User;
