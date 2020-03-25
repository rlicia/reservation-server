const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

//รับ RFID tag ส่ง Slot ถ้าถูก
router.post('/esp/parking', (req, res) => {
    res.send('Check RFID');
});

router.post('/esp/driveout', (req, res) => {
    res.send('check drive out');
});

module.exports = router;