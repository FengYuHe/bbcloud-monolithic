'use strict';
require('../nconf');
require('../mongoose');
var service = require('../services/device-integration-service');
var iot = require('../services/aliyun/iot');

var data = {
};
data.macAddresses = ['00:00:00:00:00:00'];
data.keys = ['key5','key7'];
data.assets = ['key6', 'key8'];

// var common = {key: 'manifest:bbcloudDeviceId', value: 'oza3XwWY50x-6r-qW0DAcIqmtuQA'};
// service.upsertCommonAppConfiguration(common);
//
var device1 = {key: 'key1', value: 'value1', macAddress: '00:00:00:00:00:00'};
var device2 = {key: 'key2', value: {path: "/tmp/downloads/test2.file", url: "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png"}, macAddress: '00:00:00:00:00:00'};
var device3 = {key: 'key3', value: 'value3', macAddress: '00:00:00:00:00:00'};
var device4 = {key: 'key4', value: {path: "/tmp/downloads/test4.file", url: "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png"}, macAddress: '00:00:00:00:00:00'};
var device5 = {key: 'key5', value: 'value5.new', macAddress: '00:00:00:00:00:00'};
var device6 = {key: 'key6', value: {path: "/tmp/downloads/test6.new.file", url: "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png"}, macAddress: '00:00:00:00:00:00'};
var device7 = {key: 'key7', value: 'value7.new', macAddress: '00:00:00:00:00:00'};
var device8 = {key: 'key8', value: {path: "/tmp/downloads/test8.new.file", url: "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png"}, macAddress: '00:00:00:00:00:00'};
service.upsertDeviceAppConfiguration(device1);
service.upsertDeviceAppConfiguration(device2);
service.upsertDeviceAppConfiguration(device3);
service.upsertDeviceAppConfiguration(device4);
service.upsertDeviceAppConfiguration(device5);
service.upsertDeviceAppConfiguration(device6);
service.upsertDeviceAppConfiguration(device7);
service.upsertDeviceAppConfiguration(device8);

// service.pushDeviceAppConfiguration(data);
