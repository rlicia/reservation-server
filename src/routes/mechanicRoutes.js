const express = require('express');
const mongoose = require('mongoose');

const Transaction = mongoose.model('Transaction');
const History = mongoose.model('History');
const Slot = mongoose.model('Slot');

const router = express.Router();

//รับ RFID tag ส่ง Slot ถ้าถูก
router.post('/esp/parking', async (req, res) => {
    const { rfidTag } = req.body;
    try {
        let transaction = await Transaction.findOne({ rfidTag });
        let detail = {};
        if (transaction) {
            const slot = await Slot.findOne({ slotName: transaction.slot });
            const slotNumber = slot.slotNumber;

            detail = {
                slot: transaction.slot,
                slotNumber,
                license: transaction.license
            };
            transaction.createdAt = new Date();
            transaction.status = 2;
            transaction.expireAt = null;
            const history = new History({
                client: transaction.client,
                rfidTag: transaction.rfidTag,
                slot: transaction.slot,
                zone: transaction.zone,
                license: transaction.license,
                createdAt: new Date(),
                status: 2
            });
            await transaction.save();
            await history.save();
        }

        res.status(200).send(detail);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.post('/esp/driveout', async (req, res) => {
    const { slotNumber } = req.body;
    try {
        const slot = await Slot.findOne({ slotNumber });
        console.log(slot.slotName.toUpperCase());
        let transaction = await Transaction.findOne({ slot: slot.slotName.toUpperCase() });
        if (!transaction) {
            return res.status(404).send({ error: 'Invalid Slot Number' });
        }

        if (transaction.status === 2) {
            await Transaction.deleteOne({ slot: slot.slotName.toUpperCase() });
            const history = new History({
                client: transaction.client,
                rfidTag: transaction.rfidTag,
                slot: transaction.slot,
                zone: transaction.zone,
                license: transaction.license,
                createdAt: new Date(),
                status: 0
            });
            await history.save();
        } else {
            return res.status(404).send({ error: 'Invalid Status' });
        }

        res.status(200).send(`Slot ${slot.slotName.toUpperCase()} is available`);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

module.exports = router;