'use strict';

require('../nconf');
require('../mongoose');
var mongoose = require('mongoose');
var Promise = require('bluebird');

var AdministratorAccount = mongoose.model('AdministratorAccount');
var ManufacturerAccount = mongoose.model('ManufacturerAccount');
var Manufacturer = mongoose.model('Manufacturer');
var Batch = mongoose.model('Batch');
var Model = mongoose.model('Model');
var Device = mongoose.model('Device');
var Permission = mongoose.model('Permission');
var Role = mongoose.model('Role');

const request = require('request');
const expect = require('chai').expect;
const url = require('url');
const fs = require('fs');
const baseUrl = 'http://127.0.0.1:3000';
const Authorization = 'Bearer ';
const userName = 'admin';
const manufacturerAccountName = 'chuangshang'
const password = 'admin';

let token = '';
let emailToken = '';
var batchId;

function initAdmin(done) {
  var administratorName = userName;

  var roleName = '超级管理员';

  var permissions = [
    { name: '查询权限列表', code: 'permissions:read' },
    { name: '删除权限', code: 'permissions:delete' },
    { name: '新建权限', code: 'permissions:create' },
    { name: '修改权限', code: 'permissions:update' },

    { name: '查询角色列表', code: 'roles:read' },
    { name: '删除角色', code: 'roles:delete' },
    { name: '新建角色', code: 'roles:create' },
    { name: '修改角色', code: 'roles:update' },

    { name: '查询管理员列表', code: 'administrator-accounts:read' },
    { name: '删除管理员', code: 'administrator-accounts:delete' },
    { name: '新建管理员', code: 'administrator-accounts:create' },
    { name: '修改管理员', code: 'administrator-accounts:update' },

    { name: '查询消费者列表', code: 'customer-accounts:create' },
    { name: '删除消费者', code: 'customer-accounts:delete' },

    { name: '查询型号', code: 'models:read' },

    { name: '查询批次', code: 'batches:read' },
    // { name: '新建批次', code: 'batches:create' },
    // { name: '更新批次', code: 'batches:update' },
    { name: '查询厂商', code: 'manufacturers:read' },
    // { name: '作废批次', code: 'batches:delete' },
    { name: '作废批次', code: 'batches:invalidate' },

    // { name: '查询设备', code: 'devices:read' },
    // { name: '新建设备', code: 'devices:create' },
    // { name: '更新设备', code: 'devices:update' },
    { name: '设备阿里导入', code: 'devices:importAliyunDeviceIds' },
    { name: '生成微信设备Id', code: 'devices:generateWechatDeviceIds'},
    { name: '导入MAC地址', code: 'devices:importMACs'},

    { name: '新建厂商', code: 'manufacturer-accounts:create' },
    { name: '新建厂商账号', code: 'manufacturers:create' },
  ];

  Promise.all(mongoose.modelNames().map(function (modelName) {
    return mongoose.model(modelName).remove();
  }))
  .then(function () {
    console.log('Database clean done');
    return Promise.all([
      AdministratorAccount.register(new AdministratorAccount({ name: administratorName }), password),
      new Role({ name: roleName }).save(),
      Promise.all(permissions.map(function (permissionData) {
        return new Permission(permissionData).save();
      }))
    ])
    .spread(function (administrator, role, permissions) {
      administrator.role = role;
      role.permissions = permissions;
      return Promise.all([
        administrator.save(),
        role.save()
      ]);
    })
  })
  .then(function () {
    done();
  });
}

describe('设备号导入功能',()=>{

  describe('管理员相关权限测试验证',()=>{
    it('管理员角色权限',done=>{
      initAdmin(function () {
        done();
      })
    })

    it('管理员账号登录',done=>{
      let option = {
          url: url.resolve(baseUrl, "/administrator/auth/login"),
          body: {
              name: userName,
              password: password
          },
          json: true
      };
      request.post(option, (err, res, body) => {
          token = body.token;
          expect(err).to.be.equal(null);
          expect(res.statusCode).to.be.equal(200);
          expect(token.split('.').length).to.be.equal(3);
          done();
      });
    })

    describe('初始化',()=>{
      it('厂商账号、型号、批次、bbCloudId 等初始化',done=>{
        new Manufacturer({name:'大厂商',code:'bigbigbig'}).save(function (err,cs) {
          ManufacturerAccount.register(new ManufacturerAccount({name: manufacturerAccountName,manufacturer:cs}),password,()=>{})
        })
        .then(function (manufacturer) {
           return new Model({name:'宝宝树',code:'babyTree',manufacturer:manufacturer}).save(function (err,_model) {
             //创建批次、生成bbCloudId
             var option = {
               url: url.resolve(baseUrl,'/api/batches'),
               body:{
                 model:_model.id,
                 manufacturer:manufacturer,
                 amount:10,
                 state:0
               },
               headers:{
                 'Authorization':Authorization + token
               },
               json:true
             }
             request.post(option,(err, res, body)=>{
               if (err) {
                 console.log(err);
               }
               if (body && body) {
                 batchId = body.id
               }
               expect(body.id).to.be.a('string');
               done();
             })
           })
        })

      })
      describe('设备号导入',()=>{

        // it('管理员导入阿里云设备Id',done=>{
        //   var formData ={
        //     url:url.resolve(baseUrl,'/api/auth/devices/uploadAliIds'),
        //     body:{
        //       files:{
        //         file:fs.createReadStream(__dirname+'/deviceData/aliid10.json'),
        //       },
        //       batchId:batchId
        //     },
        //     headers:{
        //       'Authorization':Authorization + token
        //     },
        //     json:true
        //   }
        //   request.post(formData,function (err, httpResponse, body) {
        //     if (body.code !== 200) {
        //       console.log('err:',body.msg);
        //     }
        //     expect(body.code).to.be.equal(200);
        //     done();
        //   })
        // })
        // it('管理员导入微信设备Id',done=>{
        //   var option ={
        //     url:url.resolve(baseUrl,'/api/auth/devices/generateWechatDeviceIds'),
        //     body:{
        //       batchId:batchId
        //     },
        //     headers:{
        //       'Authorization':Authorization + token
        //     },
        //     json:true
        //   }
        //   request.post(option,(err,res,body)=>{
        //     if (body.code !== 200) {
        //       console.log('err:',body.msg);
        //     }
        //     expect(body.code).to.be.equal(200);
        //     done();
        //   })
        // })
        // it('管理员导入mac Id',done=>{
        //   var option ={
        //     url:url.resolve(baseUrl,'/api/auth/devices/uploadMacIds'),
        //     body:{
        //       files:{
        //         file:fs.createReadStream(__dirname+'/deviceData/macIds.xlsx'),
        //       },
        //       batchId:batchId
        //     },
        //     headers:{
        //       'Authorization':Authorization + token
        //     },
        //     json:true
        //   }
        //   request.post(option,(err,res,body)=>{
        //     if (body.code !== 200) {
        //       console.log('info:',body.msg);
        //     }
        //     expect(body.code).to.be.equal(200);
        //     done();
        //   })
        // })
        // it('管理员作废批次',done=>{
        //   var option ={
        //     url:url.resolve(baseUrl,'/api/auth/batches/invalidateBatch'),
        //     body:{
        //       batchId:batchId
        //     },
        //     headers:{
        //       'Authorization':Authorization + token
        //     },
        //     json:true
        //   }
        //   request.post(option,(err,res,body)=>{
        //     if (body.code === 400) {
        //       console.log('err:',body.msg);
        //     }
        //     expect(body.code).to.be.equal(400);
        //     expect(body.msg).to.be.equal('batch is successful and can not be modified.');
        //     done();
        //   })
        // })
      })
    })
  })
  it('管理员账号授权',done=>{

  })
  // it('管理员读取批次信息',done=>{
  //
  // })
  // describe('设备号导入',()=>{
  //   it('管理员导入阿里云设备Id',done=>{
  //
  //   })
  //   it('管理员导入微信设备Id',done=>{
  //
  //   })
  //   it('管理员导入mac Id',done=>{
  //
  //   })
  //   it('管理员作废批次',done=>{
  //
  //   })
  //
  // })
})
