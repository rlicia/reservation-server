const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    rfidTag: {
        type: String,
        required: true,
        unique: true
    },
    slot: {
        type: String,
        required: true,
        unique: true
    },
    zone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientTier',
        required: true
    },
    license: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    expireAt: {
        type: Date,
        default: Date.now,
        expires: '30m'
    },
    status: {
        type: Number,
        required: true,
        default: 1 // 0 = Off, 1 = booked, 2 = park, 3 = cancel, 4 = expire
    }
});

mongoose.model('Transaction', transactionSchema);