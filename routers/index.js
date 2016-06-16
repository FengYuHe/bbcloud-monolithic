'use strict';
const router = require('express').Router();
const expressJwt = require('express-jwt');
const nconf = require('nconf');
const glob = require('glob');
const path = require('path');
const authRouter = router;
const commonRouter = authRouter;

let isRevoked = require('./lib/isRevokedToken');

glob('**/*.router.js', function(err, files) {
  files.forEach(function(file) {
    require(path.join(__dirname, path.basename(file)));
  });
});

router.use('/api', commonRouter);
router.use('/api/auth', expressJwt({
  secret: nconf.get('secret'),
  isRevoked
}), authRouter);

module.exports = {
  router, authRouter, commonRouter
};
