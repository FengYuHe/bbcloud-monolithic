var router = require('express').Router();
var statisticService = require('../services/statistic-service');

//TODO 健康检查,暂时卸载此
router.get('/api/health-check', function(req, res){
    res.json({msg: "ok"});
});

router.use('/api/analytics', statisticService.analytics);

module.exports = router;