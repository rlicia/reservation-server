const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rfidTag: {
        type: String,
        required: true
    },
    slot: {
        type: String,
        required: true
    },
    zone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientTier',
        required: true
    },
    license: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    status: {
        type: Number,
        required: true
    }
});

mongoose.model('History', historySchema);