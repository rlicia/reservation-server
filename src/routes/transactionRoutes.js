const express = require('express');
const mongoose = require('mongoose');

const requireAuth = require('../middlewares/requireAuth');

const ClientDetail = mongoose.model('ClientDetail');
const ClientTier = mongoose.model('ClientTier');
const Slot = mongoose.model('Slot');
const Transaction = mongoose.model('Transaction');
const History = mongoose.model('History');

const router = express.Router();

router.use(requireAuth);

//Check License
router.post('/transaction/license', async (req, res) => {
    const { license } = req.body;
    try {
        const licenseCheck = await Transaction.findOne({ license });
        if (licenseCheck) {
            return res.status(422).send({ error: 'This License is already used' });
        }
        res.status(200).send(license);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.get('/transaction/zone', async (req, res) => {
    const { id } = req.user;
    try {
        const user = await ClientDetail.findOne({ client: id }).populate('tier');
        const userTier = user.tier.tierLevel;
        const tierData = await ClientTier.find({ tierLevel: { $lte: userTier, $ne: 0 } }).sort({ tierLevel: -1 });
        let tier = [];
        for(i=0; i<tierData.length; i++) {
            const slotData = await Slot.find({ zone: tierData[i]._id }).countDocuments();
            const transactionSlotData = await Transaction.find({ zone: tierData[i]._id }).countDocuments();
            const diff = slotData - transactionSlotData;
            tier.push({
                _id: tierData[i]._id,
                tierName: tierData[i].tierName.charAt(0).toUpperCase() + tierData[i].tierName.substring(1),
                tierLevel: tierData[i].tierLevel,
                slotAvailable: diff
            });
        }
        res.status(200).send({ tier });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.get('/transaction/:zone/slot', async (req, res) => {
    const { zone } = req.params;
    try {
        const totalSlots = await Slot.find().countDocuments();
        const slots = await Slot.find({ zone }).sort({ slotNumber: 1 });
        const transactionSlots = await Transaction.find({ zone }).sort({ slot: 1 });
        let name = Array(totalSlots);
        let status = Array(totalSlots);
        for(i=0; i<slots.length; i++) {
            name[slots[i].slotNumber] = slots[i].slotName.charAt(0).toUpperCase() + slots[i].slotName.substring(1);
            status[slots[i].slotNumber] = 0;
        };

        for(i=0; i<transactionSlots.length; i++) {
            if (transactionSlots.length !== 0) {
                const slotData = await Slot.findOne({ slotName: transactionSlots[i].slot });
                status[slotData.slotNumber] = 1;
            }
        };

        res.status(200).send({ name, status });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.post('/transaction/reservation', async (req, res) => {
    const { slot, license, zone } = req.body;
    const id = req.user._id;
    try {
        const detail = await ClientDetail.findOne({ client: id });
        const checkUser = await Transaction.findOne({ client: id });
        //check that this user has already book for slot or not
        if (checkUser) {
            return res.status(422).send({ error: 'You have already booked the slot' });
        }
        //check that there is this license already or not
        const checkLicense = await Transaction.findOne({ license });
        if (checkLicense) {
            return res.status(422).send({ error: 'This license has been used' });
        }
        //check that slot is 0 or not
        const checkSlot = await Transaction.findOne({ slot });
        if (checkSlot) {
            return res.status(422).send({ error: 'This slot has been taken' });
        }
        //save transaction
        const transaction = new Transaction({
            client: id,
            rfidTag: detail.rfidTag,
            slot,
            zone,
            license
        });
        const history = new History({
            client: transaction.client,
            rfidTag: transaction.rfidTag,
            slot: transaction.slot,
            zone: transaction.zone,
            license: transaction.license,
            createdAt: transaction.createdAt,
            status: transaction.status
        });
        await transaction.save();
        await history.save();
        res.status(200).send('SLOT AVAILABLE');
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.get('/transaction/load', async (req, res) => {
    const id = req.user._id;
    try {
        const transaction = await Transaction.findOne({ client: id }).populate('zone');
        let detail;
        if (transaction) {
            let statusWord = '';
            if (transaction.status === 0) {
                statusWord = 'Drive Out';
            } else if (transaction.status === 1) {
                statusWord = 'Booked';
            } else if (transaction.status === 2) {
                statusWord = 'Parked';
            } else if (transaction.status === 3) {
                statusWord = 'Canceled';
            } else if (transaction.status === 4) {
                statusWord = 'Expired';
            }

            const createdTime = transaction.createdAt.toLocaleTimeString("en-US", {timeZone: "Asia/Bangkok"});
            const time = transaction.createdAt;
            time.setHours(time.getHours(),time.getMinutes(),time.getSeconds()+1800,0);
            const expiredTime = time.toLocaleTimeString("en-US", {timeZone: "Asia/Bangkok"});
            detail = {
                license: transaction.license,
                slot: transaction.slot,
                zone: transaction.zone.tierName.charAt(0).toUpperCase() + transaction.zone.tierName.substring(1),
                status: transaction.status,
                statusWord: statusWord,
                createdAt: createdTime,
                expiredAt: expiredTime
            }
        } else {
            const detail = await History.findOne({ client: id }).sort({ createdAt: -1 });
            if (detail.status === 1 ) {
                const time = detail.createdAt;
                time.setHours(time.getHours(),time.getMinutes(),time.getSeconds()+1800,0);
                const history = new History({
                    client: detail.client,
                    rfidTag: detail.rfidTag,
                    slot: detail.slot,
                    zone: detail.zone,
                    license: detail.license,
                    createdAt: time,
                    status: 4
                });
    
                await history.save();
            }
        }

        res.status(200).send(detail);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.delete('/transaction/cancel', async (req, res) => {
    const id = req.user._id;
    try {
        let update;
        const transaction = await Transaction.findOne({ client: id });
        if (transaction) {
            if (transaction.status === 1) {
                await Transaction.deleteOne({ client: id });
                const history = new History({
                    client: transaction.client,
                    rfidTag: transaction.rfidTag,
                    slot: transaction.slot,
                    zone: transaction.zone,
                    license: transaction.license,
                    createdAt: new Date(),
                    status: 3
                });
                await history.save();
                update = 1;
            } else if (transaction.status === 2) {
                update = 2;
            } else {
                update = 1;
            }
        } else {
            const detail = await History.findOne({ client: id }).sort({ createdAt: -1 });
            if (detail.status === 1 ) {
                const time = detail.createdAt;
                time.setHours(time.getHours(),time.getMinutes(),time.getSeconds()+1800,0);
                const history = new History({
                    client: detail.client,
                    rfidTag: detail.rfidTag,
                    slot: detail.slot,
                    zone: detail.zone,
                    license: detail.license,
                    createdAt: time,
                    status: 4
                });
    
                await history.save();
            }
            update = 1;
        }

        res.status(200).send({ update });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//expires อัพเดตยังไง
//มาไม่ทัน ต้องอัพเดต histories ด้วย

router.get('/transaction/history', async (req, res) => {
    const id = req.user._id;
    try {
        const transaction = await Transaction.findOne({ client: id });
        if (!transaction) {
            const detail = await History.findOne({ client: id }).sort({ createdAt: -1 });
            if (detail.status === 1 ) {
                const time = detail.createdAt;
                time.setHours(time.getHours(),time.getMinutes(),time.getSeconds()+1800,0);
                const history = new History({
                    client: detail.client,
                    rfidTag: detail.rfidTag,
                    slot: detail.slot,
                    zone: detail.zone,
                    license: detail.license,
                    createdAt: time,
                    status: 4
                });

                await history.save();
            }
        }

        const history = await History.find({ client: id }).sort({ createdAt: -1 }).populate('zone');
        let detail = [];
        for(i=0; i<history.length; i++) {
            const status = history[i].status;
            let statusWord = '';
            if (status === 0) {
                statusWord = 'Drive Out';
            } else if (status === 1) {
                statusWord = 'Book';
            } else if (status === 2) {
                statusWord = 'Park';
            } else if (status === 3) {
                statusWord = 'Cancel';
            } else if (status === 4) {
                statusWord = 'Expire';
            }

            let createdDate = history[i].createdAt.toLocaleDateString("en-US", {timeZone: "Asia/Bangkok"});
            if (createdDate.charAt(1) === '/') {
                createdDate = '0' + createdDate;
            }
            const index = detail.findIndex(obj => obj.createdDate === createdDate);
            if (index === -1) {
                detail.push({
                    createdDate: createdDate
                });
            }
        };

        res.status(200).send(detail);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.post('/transaction/history/detail', async (req, res) => {
    const { createdDate } = req.body;
    const id = req.user._id;
    try {
        const transaction = await Transaction.findOne({ client: id });
        if (!transaction) {
            const detail = await History.findOne({ client: id }).sort({ createdAt: -1 });
            if (detail.status === 1 ) {
                const time = detail.createdAt;
                time.setHours(time.getHours(),time.getMinutes(),time.getSeconds()+1800,0);
                const history = new History({
                    client: detail.client,
                    rfidTag: detail.rfidTag,
                    slot: detail.slot,
                    zone: detail.zone,
                    license: detail.license,
                    createdAt: time,
                    status: 4
                });

                await history.save();
            }
        }

        const history = await History.find({ client: id }).sort({ createdAt: -1 }).populate('zone');
        let detail = [];
        for(i=0; i<history.length; i++) {
            const status = history[i].status;
            let statusWord = '';
            if (status === 0) {
                statusWord = 'Drive Out';
            } else if (status === 1) {
                statusWord = 'Book';
            } else if (status === 2) {
                statusWord = 'Park';
            } else if (status === 3) {
                statusWord = 'Cancel';
            } else if (status === 4) {
                statusWord = 'Expire';
            }

            let createdAt = history[i].createdAt.toLocaleDateString("en-US", {timeZone: "Asia/Bangkok"});
            if (createdAt.charAt(1) === '/') {
                createdAt = '0' + createdAt;
            }
            if (createdDate === createdAt) {
                detail.push({
                    _id: history[i]._id,
                    rfidTag: history[i].rfidTag,
                    license: history[i].license,
                    slot: history[i].slot,
                    zone: history[i].zone.tierName.charAt(0).toUpperCase() + history[i].zone.tierName.substring(1),
                    createdTime: history[i].createdAt.toLocaleTimeString("en-US", {timeZone: "Asia/Bangkok"}),
                    status: statusWord
                });
            }
        };

        res.status(200).send(detail);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.get('/location', (req, res) => {
    res.status(200).send([100.463711, 13.723225]); //[lon, lat]
});

module.exports = router;