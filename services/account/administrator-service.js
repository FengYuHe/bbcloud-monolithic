'use strict';
const AuthService = require('./base/auth-service');
const mongoose = require('mongoose');
const passport = require('passport');
const co = require('co');

module.exports = class AdministratorService extends AuthService {

  constructor() {
    super();
    this.name = 'administrator';
    this.model = mongoose.model('AdministratorAccount');
    this.revokeTokenModel = mongoose.model('RevokeToken');
  }

  createTokenExtras(user, done) {
    this.model.findById(user.id).populate({
      path: 'role',
      populate: {
        path: 'permissions',
        select: 'code'
      }
    }).then(function(admin) {
      if (!admin.role) {
        done(null, {});
      } else {
        var scope = admin.role.permissions.map(function(permission) {
          return permission.code;
        }).join(',');
        done(null, {
          scope
        });
      }
    }).catch(done);
  }

  getModelDataFromRequest(body) {
    let name = body.name;
    return {
      name
    };
  }

  //添加管理员并设置密码
  addAdmin(req, res, next) {
    let password = req.body.password;
    let AdministratorAccount = mongoose.model('AdministratorAccount');

    delete req.body.password;

    let administratorAccount = new AdministratorAccount(req.body);
    administratorAccount.save().then(function() {
      return administratorAccount.setPassword(password);
    }).then(function() {
      return administratorAccount.save();
    }).then(function() {
      var reply = administratorAccount.toObject();
      reply.id = reply._id;
      delete reply._id;
      res.json(reply);
    }).catch(next);
  }

  //修改其他人的密码
  changePwd(req, res, next) {
    let id = req.body.id;
    let password = req.body.password;

    let AdministratorAccount = mongoose.model('AdministratorAccount');

    if (!id || !password) {
      res.json({
        code: 500,
        msg: 'Can not change password due to wrong args.'
      });
    } else {
      co(function*() {
        let administratorAccount = yield new Promise((resolve, reject) => {
          AdministratorAccount.findById(id, (err, administratorAccount) => {
            if (err) {
              res.json({
                code: 500,
                msg: 'Can not change password due to wrong id.'
              });
            } else {
              resolve(administratorAccount);
            }
          });
        });
        let administratorDocNewPwd = yield new Promise((resolve, reject) => {
          administratorAccount.setPassword(password, (err, administratorDocNewPwd) => {
            if (err) {
              res.json({
                code: 500,
                msg: 'Can not change password due to password hash with salt error.'
              });
            } else {
              resolve(administratorDocNewPwd);
            }
          });
        });
        administratorDocNewPwd.save(err => {
          if (err) {
            res.json({
              code: 500,
              msg: 'Can not change password due to mongodb save error.'
            });
          } else {
            res.json({
              code: 200
            });
          }
        });
      });
    };
  }

  //管理员修改自己的密码
  changeOwnPwd(req, res) {
    let id = req.user.sub;
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;

    let AdministratorAccount = mongoose.model('AdministratorAccount');

    if (!id || !oldPassword || !newPassword) {
      res.json({
        code: 500,
        msg: 'Can not change password due to wrong args.'
      });
    } else {
      co(function*() {
        let administratorAccount = yield new Promise((resolve, reject) => {
          AdministratorAccount.findById(id, (err, administratorAccount) => {
            if (err) {
              res.json({
                code: 500,
                msg: 'Can not change password due to wrong id.'
              });
            } else {
              resolve(administratorAccount);
            }
          });
        });
        let administratorDoc = yield new Promise((resolve, reject) => {
          administratorAccount.authenticate(oldPassword, (err, administratorDoc) => {
            if (err || !administratorDoc) {
              res.json({
                code: 500,
                msg: 'Can not change password due to wrong password.'
              });
            } else {
              resolve(administratorDoc);
            }
          });
        });

        let administratorDocNewPwd = yield new Promise((resolve, reject) => {
          administratorDoc.setPassword(newPassword, (err, administratorDocNewPwd) => {
            if (err) {
              res.json({
                code: 500,
                msg: 'Can not change password due to password hash with salt error.'
              });
            } else {
              resolve(administratorDocNewPwd);
            }
          })
        });
        administratorDocNewPwd.save(err => {
          if (err) {
            res.json({
              code: 500,
              msg: 'Can not change password due to mongodb save error.'
            });
          } else {
            res.json({
              code: 200
            });
          }
        });
      });
    };
  }
}
