const mongoose = require('mongoose');

const userDetailSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true
    },
    tier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserTier',
        required: true
    },
    detail: {
        firstName: {
            type: String,
            lowercase: true,
            required: true
        },
        lastName: {
            type: String,
            lowercase: true,
            required: true,
        },
        email: {
            type: String,
            lowercase: true,
            required: true,
            unique: true
        },
        gender: {
            type: Number, //0 = female, 1 = male
            lowercase: true,
            required: true
        }
    },
    status: {
        type: Number,
        required: true,
        default: 1
    }
});

mongoose.model('UserDetail', userDetailSchema);