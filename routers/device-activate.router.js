var router = require('express').Router();
var deviceService = require('../services/devices-service');

router.use('/api/devices/exchange-id', deviceService.getDeviceInfo);

module.exports = router;