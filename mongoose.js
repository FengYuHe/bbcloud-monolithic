var mongoose = require('mongoose');
var nconf = require('nconf');

mongoose.connect(nconf.get('mongodb'));

require('./models/administrator-account');
require('./models/customer-account');
require('./models/manufacturer-account');

require('./models/permission');
require('./models/role');

require('./models/manufacturer');
require('./models/batch');
require('./models/model');

require('./models/device');
require('./models/revoke-token');
require('./models/send-email');
require('./models/analytic');
require('./models/manufacturer-type');
require('./models/common-app-configuration');
require('./models/device-app-configuration');
require('./models/story-category');
require('./models/story');
require('./models/emoji');
require('mongoose-auto-increment')
require('./models/group');
require('./models/habit-music');
require('./models/habit-plan');