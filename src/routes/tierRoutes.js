const express = require('express');
const mongoose = require('mongoose');

const requireAuth = require('../middlewares/requireAuth');
const requireActivation = require('../middlewares/requireActivation');
const requireUser = require('../middlewares/requireUser');

const ClientDetail = mongoose.model('ClientDetail');
const UserDetail = mongoose.model('UserDetail');
const ClientTier = mongoose.model('ClientTier');
const UserTier = mongoose.model('UserTier');
const Slot = mongoose.model('Slot');

const router = express.Router();

router.use(requireAuth);
router.use(requireActivation);
router.use(requireUser);

//Get Tier
router.get('/user/tier/:status', async (req, res) => {
    const { status } = req.params;
    try {
        let tierData;
        let tier = [];
        if (status === '1') {
            tierData = await ClientTier.find().sort({ tierLevel: -1 });
            for(i=0; i<tierData.length; i++) {
                tier.push({
                    _id: tierData[i]._id,
                    tierName: tierData[i].tierName.charAt(0).toUpperCase() + tierData[i].tierName.substring(1),
                    tierLevel: tierData[i].tierLevel
                });
        }
        }
        if (status === '0') {
            tierData = await UserTier.find().sort({ tierLevel: -1 });
            for(i=0; i<tierData.length; i++) {
                tier.push({
                    _id: tierData[i]._id,
                    tierName: tierData[i].tierName.charAt(0).toUpperCase() + tierData[i].tierName.substring(1),
                    tierLevel: tierData[i].tierLevel
                });
            }
        }
        
        res.status(200).send({ tier });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Create Tier
router.post('/user/tier/:status', async (req, res) => {
    const { status } = req.params;
    const { tierName, order, orderTierLevel, permissions } = req.body;

    try {
        let tier;
        if (status === '1') {
            const checkTierName = await ClientTier.findOne({ tierName });
            const checkFirstChar = await ClientTier.findOne({ tierName: { $regex: `^${tierName.charAt(0)}` } });
            if (checkTierName) {
                return res.status(422).send({ error: 'This tier name is already taken' });
            }
            if (checkFirstChar) {
                return res.status(422).send({ error: 'First Character of tier name is already taken' });
            }

            let level;
            if ((order || order === 0) && orderTierLevel) {
                if (orderTierLevel === -1) {
                    max = await ClientTier.findOne().sort({ tierLevel: -1 });
                    level = max.tierLevel + order;
                } else {
                    level = orderTierLevel + order;
                }

                const greaterEqualOrderTiers = await ClientTier.find({ tierLevel: { $gte: level } }).sort({ tierLevel: -1 });
                for(i=0; i< greaterEqualOrderTiers.length; i++) {
                    greaterEqualOrderTiers[i].tierLevel += 1;
                    await greaterEqualOrderTiers[i].save();
                }
            }
            
            tier = new ClientTier({ tierName, tierLevel: level });
        }
        if (status === '0') {
            const checkPermissions = await UserTier.findOne({ permissions });
            if (checkPermissions) {
                return res.status(422).send({ error: `${checkPermissions.tierName.toUpperCase()} uses same permission set` });
            }

            const checkTierName = await UserTier.findOne({ tierName });
            if (checkTierName) {
                return res.status(422).send({ error: 'This tier name is already taken' });
            }

            let level;
            if ((order || order === 0) && orderTierLevel) {
                if (orderTierLevel === -1) {
                    max = await UserTier.findOne().sort({ tierLevel: -1 });
                    level = max.tierLevel + order;
                } else {
                    level = orderTierLevel + order;
                }
                const greaterEqualOrderTiers = await UserTier.find({ tierLevel: { $gte: level } }).sort({ tierLevel: -1 });
                for(i=0; i< greaterEqualOrderTiers.length; i++) {
                    greaterEqualOrderTiers[i].tierLevel += 1;
                    await greaterEqualOrderTiers[i].save();
                }
            }

            tier = new UserTier({ tierName, tierLevel: level, permissions });
        }

        await tier.save();
        res.status(200).send('Tier Created');
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Get Permission
router.get('/user/tier/permissions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const tier = await UserTier.findById(id);
        const permissions = tier.permissions;
        res.status(200).send({ permissions });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Update Tier
router.put('/user/tier/:status/:id', async (req, res) => {
    const { status, id } = req.params;
    const { tierName, order, orderTierLevel, permissions } = req.body;
    try {
        if (status === '1') {
            let tier = await ClientTier.findById(id);
            const oldTierLevel = tier.tierLevel;
            if (!tier) {
                return res.status(404).send({ error: 'Invalid tier' });
            }

            const checkTierName = await ClientTier.findOne({ tierName });
            const checkFirstChar = await ClientTier.findOne({ tierName: { $regex: `^${tierName.charAt(0)}` } });
            if (checkTierName && tier.tierName !== tierName.toLowerCase()) {
                return res.status(422).send({ error: 'This tier name is already taken' });
            }
            if (checkFirstChar && tier.tierName.charAt(0) !== tierName.charAt(0).toLowerCase()) {
                return res.status(422).send({ error: 'First Character of tier name is already taken' });
            }
            if ((order || order === 0) && orderTierLevel) {
                const level = orderTierLevel + order;
                const greaterEqualOrderTiers = await ClientTier.find({ tierLevel: { $gte: level } }).sort({ tierLevel: -1 });
                for(i=0; i< greaterEqualOrderTiers.length; i++) {
                    greaterEqualOrderTiers[i].tierLevel += 1;
                    await greaterEqualOrderTiers[i].save();
                }
                tier.tierLevel = level;
                await tier.save();
                const greaterThanOldTier = await ClientTier.find({ tierLevel: { $gt: oldTierLevel } }).sort({ tierLevel: 1 });
                for(i=0; i< greaterThanOldTier.length; i++) {
                    greaterThanOldTier[i].tierLevel -= 1;
                    await greaterThanOldTier[i].save();
                }
            }

            tier.tierName = tierName;
            await tier.save();
            res.status(200).send('Tier Updated');
        }
        if (status === '0') {
            let tier = await UserTier.findById(id);
            const oldTierLevel = tier.tierLevel;
            if (!tier) {
                return res.status(404).send({ error: 'Invalid tier' });
            }

            const checkTierName = await UserTier.findOne({ tierName });
            if (checkTierName && tier.tierName !== tierName.toLowerCase()) {
                return res.status(422).send({ error: 'This tier name is already taken' });
            }

            const checkPermissions = await UserTier.findOne({ permissions });
            if (checkPermissions) {
                if (checkPermissions._id.toString() !== id) {
                    return res.status(422).send({ error: `${checkPermissions.tierName.toUpperCase()} uses same permission set` });
                }
            }

            if ((order || order === 0) && orderTierLevel) {
                const level = orderTierLevel + order;
                const greaterEqualOrderTiers = await UserTier.find({ tierLevel: { $gte: level } }).sort({ tierLevel: -1 });
                for(i=0; i< greaterEqualOrderTiers.length; i++) {
                    greaterEqualOrderTiers[i].tierLevel += 1;
                    await greaterEqualOrderTiers[i].save();
                }
                tier.tierLevel = level;
                await tier.save();
                const greaterThanOldTier = await UserTier.find({ tierLevel: { $gt: oldTierLevel } }).sort({ tierLevel: 1 });
                for(i=0; i< greaterThanOldTier.length; i++) {
                    greaterThanOldTier[i].tierLevel -= 1;
                    await greaterThanOldTier[i].save();
                }
            }

            tier.permissions = permissions;
            tier.tierName = tierName;
            await tier.save();
            res.status(200).send('Tier Updated');
        }
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

//Delete Tier
router.delete('/user/tier/:status/:id', async (req, res) => {
    const { status, id } = req.params;
    try {
        if (status === '1') {
            const tier = await ClientTier.findById(id);
            if (!tier) {
                return res.status(404).send({ error: 'Invalid tier' });
            }

            const notAssigned = await ClientTier.findOne({ tierLevel: 0 });
            await ClientDetail.updateMany({ tier: id }, { $set: { tier: notAssigned._id } });
            await Slot.deleteMany({ tier: id });
            await ClientTier.deleteOne({ _id: id });
            await ClientTier.updateMany({ tierLevel: { $gt: tier.tierLevel } }, { $inc: { tierLevel: -1 } });
        }
        if (status === '0') {
            const tier = await UserTier.findById(id);
            if (!tier) {
                return res.status(404).send({ error: 'Invalid tier' });
            }

            const notAssigned = await UserTier.findOne({ tierLevel: 0 });
            await UserDetail.updateMany({ tier: id }, { $set: { tier: notAssigned._id } });
            await Slot.deleteMany({ tier: id });
            await UserTier.deleteOne({ _id: id });
            await UserTier.updateMany({ tierLevel: { $gt: tier.tierLevel } }, { $inc: { tierLevel: -1 } });
        }

        res.status(200).send('Tier Deleted');
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
});

module.exports = router;



