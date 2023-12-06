const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            min: 5,
            max: 25,
        },
        password: {
            type: String,
            required: true,
            min: 5,
            max: 300,
        },
        ConfirmPassword: {
            type: String,
            required: true,
            min: 5,
            max: 300,
        },
        email: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        age: {
            type: String,
            required: false,
        },
        fullName: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        cart: [{
            type: mongoose.Types.ObjectId,
            ref: 'Product',
        }]
    },
    {
        timestamps: true
    }
);

userSchema.pre('save', async function (next) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(this.password, salt);
        this.password = hashed;
        const hashedr = await bcrypt.hash(this.ConfirmPassword, salt);
        this.ConfirmPassword = hashedr;
        next();
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

userSchema.methods.genAuthToken = function () {
    return jwt.sign(this.toJSON(), config.SECRET_KEY);
};
userSchema.methods.checkPassword = function (password) {
    return bcrypt.compare(password, this.password)
}


const User = mongoose.model('User', userSchema);
module.exports = User