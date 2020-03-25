const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    slotName: {
        type: String,
        lowercase: true,
        required: true,
        unique: true
    },
    slotNumber: {
        type: Number,
        required: true,
        unique: true
    },
    zone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientTier',
        required: true
    }
});

mongoose.model('Slot', slotSchema);