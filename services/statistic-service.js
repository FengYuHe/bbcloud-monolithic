var Analytic = require('mongoose').model('Analytic');

exports.analytics = function(req, res){
    if(!Array.isArray(req.body)){
        return res.json({code: 500, msg: 'request fail'});
    }
    var eventArray = req.body;
    var ip = req.ip;
    var msg = [];
    var time = Date.now();
    eventArray.forEach(function(item, index){
        msg.push(item.eventId);
        var event = {
            eventId: item.eventId,
            event: item.event,
            data: item.data,
            metadata: {
                time: time,
                ip: ip
            }
        };
        var entity = new Analytic(event);
        entity.save();
    });
    res.json(msg);
};