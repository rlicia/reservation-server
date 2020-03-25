const mongoose = require('mongoose');

const clientDetailSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true
    },
    tier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientTier',
        required: true
    },
    rfidTag: {
        type: String,
        required: true,
        unique: true
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

mongoose.model('ClientDetail', clientDetailSchema);