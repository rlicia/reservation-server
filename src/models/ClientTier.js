const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema({
    tierName: {
        type: String,
        lowercase: true,
        required: true,
        unique: true
    },
    tierLevel: {
        type: Number,
        required: true,
        unique: true
    }
});

mongoose.model('ClientTier', tierSchema);