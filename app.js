//app.js
App({
  onLaunch: function () {

    var Bmob = require('utils/bmob.js');
    Bmob.initialize("f26e061cda423a4fb1d09e177364b89b", "0558112a3cc77cae01374a324564e1c6");

    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  globalData: {
    userInfo: null
  }
})