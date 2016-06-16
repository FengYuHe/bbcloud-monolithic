const router = require('.').router;
var statisticService = require('../services/statistic-service');

//TODO 健康检查,暂时卸载此
router.get('/health-check', function(req, res){
    res.json({msg: "ok"});
});

router.use('/analytics', statisticService.analytics);

module.exports = router;