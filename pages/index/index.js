const app = getApp();
var _this;
var Bmob = require('../../utils/bmob.js');
var _sessionObjectName = 'Session';
var bmob_session = Bmob.Object.extend(_sessionObjectName);

Page({

  /**
   * 页面的初始数据
   */
  data: {
    validSessions: null,
    expiredSessions: null,
    hideExpiredSessionView: true,
    hideValidSessionView: true,
    openID: null,
    shareData: {
      title: '自定义分享标题',
      desc: '自定义分享描述',
      path: '/pages/index/index'
    }
  },
  onShareAppMessage: function () {
    return this.data.shareData
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    _this = this;
    if (app.globalData.openID) {
      console.log("on load, app.globalData is already set");
      fetchSessions(app.globalData.openID);
      this.setData({
        openID: app.globalData.openID,
      })
    } else {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况

      app.getOpenIDCallback = res => {
        console.log("onload, app.globalData is set later");
        this.setData({
          openID: res,
        })
        fetchSessions(res)
      }
    }
    },

  /* 用户点击事件 */

  // 新建投票
  createVoteTapped: function() {
    wx.navigateTo({
      url: '../create/create',
    })
  },

  // 点击 正在投票
  currentVoteTapped: function(res) {
    var session = this.data.validSessions[res.currentTarget.dataset.id];
    
    wx.navigateTo({
      url: '../voting/voting?session=' + JSON.stringify(session) + '&expired=' + false
    })
  },

  // 点击 往期投票
  pastVoteTapped: function (res) { 
    var session = this.data.expiredSessions[res.currentTarget.dataset.id];
    wx.navigateTo({
      url: '../voting/voting?session=' + JSON.stringify(session) + '&expired=' + true
    })
  }
})

function fetchSessions(openid) {

  var now = new Date();
  var nowDateStr = now.getFullYear().toString() + "-" + now.getMonth().toString() + "-" + now.getDate().toString();
  var nowTimeStr = now.getHours().toString() + ":" + now.getMinutes().toString();
  var nowStr = nowDateStr + " " + nowTimeStr;
  var nowMilSeconds = Date.parse(nowStr);

  wx.showLoading({
    title: '',
  })
  var query = new Bmob.Query(bmob_session);
  query.contains('openIDs', openid);
  query.find({
    success: function(res) {
      wx.hideLoading()
      var validSessions = [];
      var expiredSessions = [];
      for(var index in res) {
        var session = res[index];
        var date = new Date();
        
        if (session.attributes.deadlineTimeMiliSec < nowMilSeconds) {
          expiredSessions.push(session.attributes);
        } else {
          validSessions.push(session.attributes);
        }
      }
      _this.setData({ 
        validSessions: validSessions, 
        expiredSessions: expiredSessions, 
        hideExpiredSessionView: expiredSessions.length == 0, 
        hideValidSessionView: validSessions.length == 0});
    },
    error: res=> {
      wx.hideLoading()
      wx.showToast({
        title: '获取数据错误，请重试',
        icon: 'none'
      })
    }
  });
}