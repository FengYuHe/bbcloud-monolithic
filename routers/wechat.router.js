var nconf = require('nconf');
var router = require('.').router;
var commonRouter = require('.').commonRouter;
var passport = require('passport');
var WeChat = require('wechat');
var WechatService = require('../services/account/customer-service');
var weService = require('../services/wechat-service.js');
var storyService = require('../services/wechat/story-service')
var emojiService = require('../services/wechat/emoji-service');
var habitPlanService = require('../services/wechat/habit-plan-service');

var config = {
  token: nconf.get('wechat:token'),
  appid: nconf.get('wechat:appId'),
  appsecret: nconf.get('wechat:appSerect'),
  encodingAESKey: nconf.get('wechat:encodingAESKey')
};
var ws = new WechatService();

// airkiss
commonRouter.get('/wechat/getJsApiConfig', weService.getJsConfig);   //获取微信H5 jsApi 相关配置




//微信app TODO 加token验证
commonRouter.get('/wx/createMenu',ws.createMenu);
commonRouter.get('/wx/login',ws.requestWechatLogin);
commonRouter.get('/wx/jsapi',ws.wechatJsApiSign);
commonRouter.get('/wx/wechatCallback',ws.wechatCallback,ws.checkAccount,ws.getToken);
commonRouter.get('/wx/pushStory',storyService.pushStory);

//表情包
commonRouter.get('/wechat/emoji', emojiService.getEmoji); //获取表情包
commonRouter.post('/wechat/emoji/dibble', emojiService.emojiDibble); //点播表情包

//习惯养成
commonRouter.get('/wechat/habitPlan', habitPlanService.getHabitPlan); //获取习惯列表
commonRouter.post('/wechat/habitPlan', habitPlanService.createHabitPlan); //创建习惯
commonRouter.delete('/wechat/habitPlan', habitPlanService.deleteHabitPlan); //删除习惯

commonRouter.get('/wechat/getDevice', weService.getOpenId, weService.Devices);  //微信H5获取用户绑定设备
commonRouter.get('/wechat/unbindDevice', weService.unbindDevice); //微信H5页面解绑

//social
router.get('/wechat/inviteFamilyMember', weService.getOpenId, weService.invteFamilyMember);//邀请家人
router.get('/wechat/exitGroup',  weService.getOpenId, weService.exitGroup);//退出家庭圈
router.get('/wechat/showFamilyMembers', weService.getOpenId, weService.showFamilyMembers);//查看家庭列表
router.get('/wechat/changeNickName', weService.getOpenId, weService.changeNickName);//修改家庭昵称
router.get('/wechat/showDeviceQRcode', weService.getOpenId, weService.showDeviceQRcode);//设备二维码页面
router.get('/wechat/removeDeviceFriends', weService.getOpenId, weService.removeDeviceFriends);//删除好友
router.get('/wechat/addDeviceFriends', weService.getOpenId, weService.addDeviceFriends);//添加好友
router.get('/wechat/confirmDeviceFriends', weService.getOpenId, weService.confirmDeviceFriends);//确认添加好友
router.get('/wechat/changeFriendNickName', weService.getOpenId, weService.changeFriendNickName);//修改好友昵称
router.get('/wechat/showDeviceFriends', weService.getOpenId, weService.showDeviceFriends);//设备好友列表
router.get('/wechat/changeDeviceName', weService.getOpenId, weService.changeDeviceName);//修改设备名称


//voice
var voiceChat = require('../services/voice-chat/voice-chat');

router.use('/wechat', WeChat(config).voice(function(msg, req, res) {
  res.send('');
  voiceChat.setReceiver('wx');
  return voiceChat.listenGroup(msg, (err, res) => {
    console.log(err, res);
  });
}).middlewarify());


// message
router.use('/wechat', WeChat(config, weService.message));
