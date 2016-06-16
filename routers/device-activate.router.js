const router = require('.').router;
var deviceService = require('../services/device-service');

router.use('/devices/exchange-id', deviceService.getDeviceInfo);

module.exports = router;