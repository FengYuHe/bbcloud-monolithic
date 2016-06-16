'use strict';
//中间件，保证厂商看到的是自己的东西
module.exports.batches = (req, res, next) => {
  if (req.user.realm === 'manufacturer') {
    try {
      req.body.manufacturer = req.user.manufacturer;
    } catch (err) {}
    req.query._filters = req.query._filters? JSON.parse(req.query._filters) : req.query._filters || {};
    req.query._filters.manufacturer = req.user.manufacturer;
    console.log(req.query);
    console.log('add addition =========== batch');
  }
  next();
}

//中间件，保证厂商看到的是自己的东西
module.exports.models = (req, res, next) => {
  if (req.user.realm === 'manufacturer') {
    try {
      req.body.manufacturer = req.user.manufacturer;
    } catch (err) {}
    req.query._filters = req.query._filters || {};
    req.query._filters.manufacturer = req.user.manufacturer;
    console.log(req.query);
    console.log('add addition =========== model');
  }
  next();
}

module.exports.getSelect = (req, res, next) => {
  let realm = req.user.realm;
  let subject = req.user.sub;
  let manufacturer = req.params.id;
  let ManufacturerAccount = require('mongoose').model('ManufacturerAccount');
  ManufacturerAccount.findByIdAndUpdate(subject, {
    manufacturer
  }).then(function() {
    let secret = require('nconf').get('secret');
    let token = require('jsonwebtoken').sign({
      realm,
      manufacturer
    }, secret, {
      subject
    });
    res.json({
      token
    });
  }).catch(next);
}
