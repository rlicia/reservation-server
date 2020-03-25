const express = require('express');
const mongoose = require('mongoose');

const requireAuth = require('../middlewares/requireAuth');
const requireActivation = require('../middlewares/requireActivation');
const requireUser = require('../middlewares/requireUser');

const ClientTier = mongoose.model('ClientTier');
const Slot = mongoose.model('Slot');

const router = express.Router();

router.use(requireAuth);
router.use(requireActivation);
router.use(requireUser);

//Get Slot
router.get('/user/slot', async (req, res) => {
    try {
        const zoneData = await ClientTier.find().sort({ tierLevel: -1 });

        let zone = [];
        let slot = [];
        for(i=0; i<zoneData.length-1; i++) { //not include not assigned tier
            const slotCount = await Slot.find({ zone: zoneData[i]._id }).countDocuments();
            zone.push({
                _id: zoneData[i]._id,
                zoneName: zoneData[i].tierName.charAt(0).toUpperCase() + zoneData[i].tierName.substring(1),
                zoneLevel: zoneData[i].tierLevel
            });
            slot.push(slotCount.toString());
        }

        res.status(200).send({ zone, slot });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

router.post('/user/updateSlots', async (req, res) => {
    const { slotUpdated } = req.body;
    try {
        const zoneData = await ClientTier.find().sort({ tierLevel: -1 });
        let add = [];
        let remove = [];
        let same = [];
        for(i=0; i<zoneData.length-1; i++) {
            const initialSlots = await Slot.find({ zone: zoneData[i]._id }).countDocuments();
            let difference = slotUpdated[i] - initialSlots;
            if (difference > 0) {
                add.push({
                    _id: zoneData[i]._id,
                    zoneName: zoneData[i].tierName.charAt(0).toUpperCase() + zoneData[i].tierName.substring(1),
                    zoneLevel: zoneData[i].tierLevel,
                    difference: difference
                });
            } else if (difference < 0) {
                remove.push({
                    _id: zoneData[i]._id,
                    zoneName: zoneData[i].tierName.charAt(0).toUpperCase() + zoneData[i].tierName.substring(1),
                    zoneLevel: zoneData[i].tierLevel,
                    difference: difference
                });
            } else {
                same.push({
                    _id: zoneData[i]._id,
                    zoneName: zoneData[i].tierName.charAt(0).toUpperCase() + zoneData[i].tierName.substring(1),
                    zoneLevel: zoneData[i].tierLevel,
                    difference: difference
                });
            }
            if (initialSlots > 0) {
                await Slot.deleteMany({ zone: zoneData[i]._id });
            }
        };

        let slotNumber = 0;
        let zoneSlots = [];
        for(i=0; i<zoneData.length-1; i++) {
            for(n=1; n<=slotUpdated[i]; n++) {
                slotNumber += 1;
                zoneSlots.push({
                    slotName: zoneData[i].tierName.charAt(0).toUpperCase() + n,
                    slotNumber: slotNumber,
                    zone: zoneData[i]._id
                })
            };
        };

        await Slot.insertMany(zoneSlots);
        console.log(zoneSlots);
        let updateDetails = {add, remove, same};
        console.log(updateDetails);
        res.status(200).send({ updateDetails });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

module.exports = router;