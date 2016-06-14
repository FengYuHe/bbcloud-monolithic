var fs = require('fs');
var router = require('express').Router();
var Device = require('mongoose').model('Device');
var Batch = require('mongoose').model('Batch');
var model = require('mongoose').model('Model');
var UUID = require('node-uuid');
var XLSX = require('xlsx');
var Promise = require('bluebird');
var _ = require('lodash');

var batchState = [
    {val:-1,msg:'作废'},
    {val:0,msg:'新建'},
    {val:1,msg:'已完成'},
    {val:2,msg:'已上传阿里云设备Id'},
    {val:3,msg:'已完成微信设备Id导入'},
    {val:4,msg:'已完成macId导入'}
];

function mongoIdToWebId(entity) {
    var o = entity.toObject();
    o.id = o._id.toString();
    delete o._id;
    return o;
}

function generateBBCloudId(){
    var manufacturerCode = 'AAA',
        toyCode = 'BBBBBB',
        uuid = UUID(),
        year = new Date().getFullYear().toString().substring(2,4);

    return manufacturerCode+toyCode+year+uuid;
}

function saveMultiRecords(devices) {
    var len = devices.length;
    var perSaveNum = 10;
    var times = Math.ceil(len / perSaveNum);
    var start = 0 ,end = 0;
    for (var i = 0; i < times; i++) {
        start = perSaveNum*i;
        end = (start + perSaveNum)>len?len:(start + perSaveNum);
        var toSaveDevices = devices.slice(start,end)
        Device.insertMany(toSaveDevices)
    }
}

function promiseSequentialize(promiseFactories) {
    var chain = Promise.resolve();
    promiseFactories.forEach(function (promiseFactory) {
        chain = chain.then(promiseFactory);
    });
    return chain;
}
function httpRequestWechatIds(data) {
    return Promise.resolve().then(function(){
        //对外请求 TODO
        if (!data) {
            data = new Array();
        }
        var secretStr = Math.random()+''
        var newData = {wechatId:'wechat1'+secretStr,secret:secretStr,qrticket:'qrticketString',devicelicence:'devicelicenceString'};
        data.push(newData);
        return data;
    })
}

exports.reqesutWechatDeviceIds = function (req,res,next) {
    //请求微信硬件设备Id
    var wechatRequestArray=[];
    //请求3个设备号
    for (var i = 0; i < req.deviceAmount; i++) {
        wechatRequestArray.push(httpRequestWechatIds)
    }
    promiseSequentialize(wechatRequestArray).then(function (data) {
        req.wechatIds = data;
        next();
    })
}

exports.generateWechatDeviceIds = function (req,res) {
    //save wecaht device Ids
    var wechatIds = req.wechatIds;
    var batchId = req.body.batchId;
    console.log(wechatIds);
    //find all records by batchId
    Device.find({batchId:batchId}).then(function(data){
        if (!data) {
            res.json({code:400,msg:'devices not found'})
        }
        if (data.length == wechatIds.length) {

            Promise.resolve().then(function () {
                data.forEach(function (item,index) {
                    var deviceData = {
                        wechatDeviceId:wechatIds[index].wechatId,
                        wechatDeviceQrticket:wechatIds[index].qrticket,
                        wechatDeviceLicence:wechatIds[index].devicelicence
                    }
                    Device.findByIdAndUpdate(item._id, deviceData).then(function (entity) {

                    });
                })
                //upload batch state
                Batch.findByIdAndUpdate(batchId,{state:batchState[4].val}).then(()=>{})
            }).then(function () {
                res.json({code:200, msg:'ok'})
            })
        }else{
            res.json({code:400, msg:'wechatIds count is not matched with batch count.'})
        }
    })
}

function checkScope(scope, permission) {
    scope = scope || [];
    return scope.indexOf(permission) === -1;
}

exports.checkDeleteAuth = function (req,res,next) {
    var operateType = 'delete';
    checkIt(req,res,next,operateType);
}

function checkIt(req,res,next,operateType) {
    if (req.user.realm === 'administrator') {
        if (checkScope(req.scope, 'devices:'+operateType)) {
            return res.sendStatus(403);
        }else{
            next();
        }
    }else {
        res.json({code:403,msg:'no auth to operate'})
    }
}
exports.checkUpdateAuth = function (req,res,next) {
    var operateType = 'update';
    checkIt(req,res,next,operateType);
}
exports.checkBatchState = function (req,res,next) {
    Batch.findById(req.body.batchId).populate({
        path:'manufacturer',
        select:'_id'
    }).then(function (entity) {
        if (entity) {
            req.manufacturerId = entity.manufacturer._id;
            req.deviceAmount = entity.amount;
            if (entity.state==1) {
                res.json({code:400, msg:'batch has success and can not be modified.'})
            }else if(entity.state==-1){
                res.json({code:400, msg:'batch had been deleted'})
            }else{
                next();
            }
        }else {
            res.json({code:400,msg:'manufacturer not found'})
        }
    })
}
exports.parseAliIds_Json = function (req,res,next) {
    if (req.user.realm === 'administrator') {
        var filePath = req.body.files.file.path;
        if (filePath) {
            fs.readFile(filePath, {encoding:'utf-8'}, function (err, bytesRead) {
                if (err) {
                    next(err);
                }
                req.aliIds = JSON.parse(bytesRead);
                next()
            });
        }else{
            res.json({code:400,msg:'filePath is required'})
        }
    }else {
        res.json({code:400, msg:'no auth to operate'})
    }
}

exports.uploadAliIds = function (req,res) {
    if (req.user.realm === 'administrator') {
        var filePath = req.body.files.file.path;
        if (filePath) {
            fs.readFile(filePath, {encoding:'utf-8'}, function (err, bytesRead) {
                if (err) {
                    next(err);
                }
                var aliIds = JSON.parse(bytesRead) || [];
                var batchId = req.body.batchId;
                //find all records by batchId
                Device.find({batchId:batchId}).then(function(data){
                    console.log('data:',data);
                    console.log('aliIds',aliIds);
                    if (data.length === aliIds.length) {
                        console.log('fuu');
                        Promise.resolve().then(function () {
                            data.forEach(function (item,index) {
                                var deviceData = {
                                    _id:item._id,
                                    aliyunDeviceId:aliIds[index].device_id,
                                    aliyunDeviceSecret:aliIds[index].device_secret
                                }
                                Device.findByIdAndUpdate(item._id, deviceData).then(function (entity) {

                                });
                            })
                            //upload batch state
                            Batch.findByIdAndUpdate(batchId,{state:batchState[3].val}).then(()=>{})
                        }).then(function () {
                            res.json({code:200, msg:'ok'})
                        })
                    }else{
                        res.json({code:400, msg:'aliIds count is not matched with batch count.'})
                    }
                })
            });
        }else{
            res.json({code:400,msg:'filePath is required'})
        }
    }else {
        res.json({code:400, msg:'no auth to operate'})
    }

}

exports.parseMacIds_XLSX = function (req,res,next) {
    if (req.user.realm === 'administrator') {
        var filePath = req.files.file.path;
        if (filePath) {
            var workbook = XLSX.readFile(filePath);
            /* DO SOMETHING WITH workbook HERE */
            var sheet_name_list = workbook.SheetNames;
            var tempRows = [];
            sheet_name_list.forEach(function(y) { /* iterate through sheets */
                var worksheet = workbook.Sheets[y];
                //tempCount用于记数，只取两列数据
                var tempCount = 0;
                var tempRow ={};
                for (z in worksheet) {
                    /* all keys that do not begin with "!" correspond to cell addresses */
                    if(z[0] === '!') continue;
                    var rowRex = /[A,B,a,b](\d+)/;
                    if(rowRex.test(z) && RegExp.$1>1){
                        if(tempCount == 0 ){
                            tempRow['macId'] = worksheet[z].v;
                            tempCount++;
                        }  else{
                            tempRow['macData'] = worksheet[z].v;
                            tempRows.push(tempRow);
                            tempCount = 0,tempRow = {};
                        }
                    }else{
                        continue;
                    }
                }
            })
            if (tempRows.length==0) {
                res.json({code:400, msg:'file content is empty'})
            }
            req.macIds = tempRows;
            next();
        }else{
            res.json({code:400, msg:'filePath is required'})
        }
    }else {
        res.json({code:400, msg:'filePath is required'})
    }
}
exports.uploadMacIds = function (req,res) {
    var macIds = req.macIds;
    var batchId = req.body.batchId;

    //find all records by batchId
    Device.find({batchId:batchId}).then(function(data){
        if (!data) {
            res.json({code:400,msg:'devices not found'})
        }
        if (data.length == macIds.length) {

            Promise.resolve().then(function () {
                data.forEach(function (item,index) {
                    var deviceData = {
                        _id:item._id,
                        macAddress:macIds[index].macId,
                    }
                    Device.findByIdAndUpdate(item._id, deviceData).then(function (entity) {

                    });
                })
                //upload batch state
                Batch.findByIdAndUpdate(batchId,{state:batchState[2].val}).then(()=>{})

            }).then(function () {
                res.json({code:200, msg:'ok'})
            })
        }else{
            res.json({code:400, msg:'macIds count is not matched with batch count.'})
        }
    })
}


exports.generateBBCloudIds = function (req,res) {
    var batchId = req.body.batchId;
    var manufacturerId = req.manufacturerId;
    Batch.findById({_id:batchId}).then(function (data) {
        if (data) {
            var devicesArray = new Array(data.amount)
            for (var i = 0; i < data.amount; i++) {
                var bbId = generateBBCloudId();
                var deviceData = {
                    batchId:batchId,
                    bbcloudDeviceId:bbId,
                    manufacturerId:manufacturerId
                }
                devicesArray.push(new Device(deviceData));
            }
            //save many once
            saveMultiRecords(devicesArray);
            //upload batch state
            Batch.findByIdAndUpdate(batchId,{state:batchState[1].val}).then(()=>{
                res.json({code:200, msg:'ok'})
            })
        }else{
            res.json({err:400, msg:'batch not found'})
        }

    }).catch(function (err) {
        console.log(err);
        res.json({code:500, msg:'err'})
    })
}
exports.deleteDevies = function (req,res,next) {
    //delete devices
    var batchId = req.body.batchId;
    var reason = req.body.reason || '未填写';
    //find all records by batchId
    Device.find({batchId:batchId}).then(function(data){
        if (!data) {
            res.json({code:400,msg:'devices not found'})
        }
        Promise.resolve().then(function () {
            data.forEach(function (item,index) {
                Device.findByIdAndRemove(item._id).then(function(entity) {
                    console.log('has deleted:',item_id);
                }).catch(function (err) {
                    console.log(err);
                });
            })
            //upload batch state
            Batch.findByIdAndUpdate(batchId,{state:batchState[0].val,note:reason}).then(()=>{})
        }).then(function () {
            res.json({code:200, msg:'ok'})
        })
    })
}

exports.createDevices = function (req,res,next) {
    var data = req.body;
    console.log('data.modelId',data.model);
    var deviceModel;
    var devicesArray = [];
    Promise.resolve()
        .then(function(){
            return model.findById(data.model).then(function(result){
                console.log('data.model',result);
                deviceModel = result;
                return result;
            });
        })
        .then(function(){
            var entity = new Batch(data);
            console.log('entity',entity);
            return entity.save().then(function(result){
                console.log('result',result);
                return result;
            })
        })
        .then(function(deviceBatch){
            for(var i = 0; i < deviceBatch.amount; i++){
                var bbId = generateBBCloudId();
                var devicesData = {
                    bbcloudDeviceId: bbId,
                    name: deviceModel.name,
                    manufacturerId: data.manufacturer,
                    batchId: deviceBatch._id,
                    socialAccount: '0' + bbId,
                    socialPassword: bbId
                }
                var tempmodel = new Device(devicesData)
                devicesArray.push(tempmodel);
            }
            saveMultiRecords(devicesArray);
            // devicesArray.forEach(function(item, index){
            //   var entity = new Device(item);
            //   entity.save(function(err){
            //     console.log(err);
            //   });
            // });
            res.json(mongoIdToWebId(deviceBatch));
        }).catch(next);
}

exports.getDeviceInfo = function (req, res){
    if(!req.body.macAddress){
        return res.json({code:400,msg:'devices not found'});
    }
    var macAddress = req.body.macAddress;
    Device.findOne({macAddress: macAddress}, function(err, device){
        if(err) return res.json({code:500, msg: err});
        if(!device) return res.json({code:400,msg:'devices not found'});
        var data = _.pick(device, 'bbcloudDeviceId', 'wechatDeviceId', 'aliyunDeviceId', 'aliyunDeviceSecret');
        res.json(data);
    });
}