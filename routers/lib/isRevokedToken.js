'use strict';
const expressJwt = require('express-jwt');
const mongoose = require('mongoose');

// 验证Token是否过期且处于active状态
// 使用方法：expressJwt({ secret: 'secret', isRevoked: this._expressJwtRevoked })
module.exports = (req, payload, done) => {
  let jti = payload.jti;
  let RevokeToken = mongoose.model('RevokeToken');
  if (!!!jti) {
    return done(null, "Invalid token.");
  } else {
    RevokeToken.findById(jti, (err, doc) => {
      if (err || !!!doc || !doc.active) {
        return done(null, "Invalid token.");
      } else {
        return done();
      }
    });
  }
}
