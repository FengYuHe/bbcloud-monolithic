var mongoose = require('mongoose');
var HabitPlan = mongoose.model('HabitPlan');
var HabitMusic = mongoose.model('HabitMusic');
var CustomerAccount = mongoose.model('CustomerAccount');
var Promise = require('bluebird');
var debug = require('debug')('bbCloud:habit-plan');
var _ = require('lodash');

exports.getHabitPlan = function(req, res){
    debug('Get the habit plan:');
    //TODO 暂时写死
    var wechatOpenId = 'oza3XwWY50x-6r-qW0DAcIqmtuQA';
    var list = [];
    CustomerAccount.findOne({wechatOpenId: wechatOpenId}).then(function(customer){
        if(customer && customer.deviceId.length !== 0){
            HabitPlan.find({owner: {"$in": customer.deviceId}}).then(function(plan){
                plan.forEach(function(item, index){
                    HabitMusic.findById(item.musicId).then(function(music){
                        //TODO
                        var i = {};
                        i.number = index + 1;
                        i.fileName = music.fileName || null;
                        i.musicName = music.fileName.split('.')[0] || '无';
                        i.id = item._id;
                        i.name = item.name;
                        i.fromTime = item.fromTime;
                        i.endTime = item.endTime;
                        i.monday = item.monday;
                        i.tuesday = item.tuesday;
                        i.wednesday = item.wednesday;
                        i.thursday = item.thursday;
                        i.friday = item.friday;
                        i.saturday = item.saturday;
                        i.sunday = item.sunday;
                        list.push(i);
                        // list.push(_.defaults(i, item));
                        if(list.length === plan.length){
                            res.json(list);
                        }
                    });
                });
            });
        }else{
            res.json({code: 400, msg: 'account not has the device'});
        }
    });
};

exports.createHabitPlan = function(req, res){
    debug('Create the habit plan:');
    var body = req.body;

    //TODO 暂时写死
    var wechatOpenId = 'oza3XwWY50x-6r-qW0DAcIqmtuQA';
    var user = {};

    var music = {
        fileName: body.musicName,
        downloaded: false,
        nonce: ''
    };
    delete body.musicName;

    Promise.resolve().then(function(){
        //检查用户下是否有设备
        return CustomerAccount.findOne({wechatOpenId: wechatOpenId}).then(function(customer){
            if(!customer || customer.deviceId.length === 0){
                throw {code: 400, msg: 'The customer not have device'}
            }else{
                debug('Create the habit plan to:', customer);
                user = customer;
                return customer;
            }
        })
    }).then(function(customer){
        //检查设备的习惯名称是否存在
        return HabitPlan.findOne({name: body.name, owner: customer.deviceId[0]}).then(function(habit){
            if(habit) throw {code: 400, msg: 'The habit plan name is exist'}
            return customer;
        })
    }).then(function(customer){
        //检查习惯时间是否冲突
        return HabitPlan.find({owner: customer.deviceId[0]}).then(function(habits){
            filters(habits, body);
        })
    }).then(function(){
        //保存习惯音乐
        var entity = HabitMusic(music);
        return entity.save();
    }).then(function(data){
        var habit = HabitPlan(body);
        habit.musicId = data._id;
        habit.createdBy = user._id;
        habit.owner = user.deviceId[0];
        habit.save();
        res.json({code: 200, msg: 'ok'});
    }).catch(function(err){
        debug('Error for create the habit plan: ', err);
        res.json(err);
    });
};

exports.deleteHabitPlan = function (req, res) {
    debug('delete the habit plan:');
    var id = req.query.id || '';
    HabitPlan.remove({_id: id}).then(function(res){
        return res.json(res);
    }).catch(function(err){
        return res.json(err);
    });
};

function filters(habits, habit){
    var fromTime = Number(habit.fromTime.replace(':', ''));
    var endTime = Number(habit.endTime.replace(':', ''));

    habits.forEach(function(item, index){
        var itemFromTime = Number(item.fromTime.replace(':', ''));
        var itemEndTime = Number(item.endTime.replace(':', ''));
        //判断区间是否重叠, 大于0重叠
        var len = Math.min(endTime, itemEndTime) - Math.max(fromTime, itemFromTime);
        if(len > 0){
            var bool = weekVerify(item, habit);
            if(bool){
                throw {code: 400, msg: 'The habit plan time is exist'};
            }
        }
    });
}

function weekVerify(item, habit){
    if(habit.monday && item.monday){
        return true;
    }
    if(habit.tuesday && item.tuesday){
        return true;
    }
    if(habit.wednesday && item.wednesday){
        return true;
    }
    if(habit.thursday && item.thursday){
        return true;
    }
    if(habit.friday && item.friday){
        return true;
    }
    if(habit.saturday && item.saturday){
        return true;
    }
    if(habit.sunday && item.sunday){
        return true;
    }else{
        return false;
    }
}