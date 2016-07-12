'use strict';
var oss = require('../aliyun/emoji-oss');
var CustomerAccount = require('mongoose').model('CustomerAccount');
var Device = require('mongoose').model('Device');
var Promise = require('bluebird');
var iot = require('./../aliyun/iot');
var debug = require('debug')('bbCloud:story');

let storyService = {};

storyService.pushStory = function (req, res, next) {
  var story = req.body;
  var deviceTopic = req.query.action == 'download' ? 'downloadStory' : 'playStory';
  var messageContent = {
      deviceTopic: deviceTopic,
      payload: {
          bucket: 'story',
          filename: story.fileName
      }
  };
  //TODO 暂时固定
  var openId = 'oza3XwWY50x-6r-qW0DAcIqmtuQA';

  //查找设备
  new Promise(function (resolve,reject) {
    CustomerAccount.findOne({"wechatOpenId": openId}).populate({
      path: 'deviceId',
      select: 'macAddress'
    }).then(function(customerAccount){
        if(!customerAccount) {
          reject({code: 400, msg: 'customerAccount not found'})
        }
        resolve(customerAccount);
    })
  }).then(function (account) {
    //推送
    iot.pub({MacAddress: account.deviceId.macAddress, MessageContent: messageContent}, function(err, result){
        if(err) console.log(err);
        debug('iot result:' , result);
    });
    //记录操作 TODO
  }).then(function () {
      //结果返回
      res.json({code:200,msg:'ok'})
  }).catch(function (err) {
    next({code:400,msg:err})
  })
}

module.exports = storyService;
