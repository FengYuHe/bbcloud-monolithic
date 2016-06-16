'use strict';
const authRouter = require('.').authRouter;
const commonRouter = require('.').commonRouter;
const ds = require('../services/device-service');

let libManufacturer = require('./lib/manufacturer');
let resource = require('../services/resource-service');
let AdministratorService = require('../services/account/administrator-service');

let administractorService = new AdministratorService();

authRouter.post('/administrator-accounts', administractorService.addAdmin);

authRouter.use('/batches', libManufacturer.batches);
authRouter.use('/models', libManufacturer.models);

authRouter.post('/batches', ds.createDevices);

authRouter.use(resource('administrator-accounts', 'AdministratorAccount'));
authRouter.use(resource('customer-accounts', 'CustomerAccount'));
authRouter.use(resource('manufacturer-accounts', 'ManufacturerAccount'));

authRouter.use(resource('roles', 'Role'));
authRouter.use(resource('permissions', 'Permission'));

authRouter.use(resource('manufacturers', 'Manufacturer'));
authRouter.use(resource('batches', 'Batch'));
authRouter.use(resource('models', 'Model'));
