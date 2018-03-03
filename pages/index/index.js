const app = getApp();

var Objects = require('../../utils/objects.js');
var Helper = require('../../utils/helper.js');
var Bmob = require('../../utils/bmob.js');
var _sessionObjectName = 'Session';
var bmob_session = Bmob.Object.extend(_sessionObjectName);

var _this;

Page({
  data: {
    validSessions: null,
    expiredSessions: null,
    hideExpiredSessionView: true,
    hideValidSessionView: true,
    openID: null
  },
  onShow: function() {
    wx.getStorage({
      key: 'indexPageShouldReload',
      success: function(res) {
        wx.removeStorage({
          key: 'indexPageShouldReload',
          success: function(res) {},
        })
        fetchSessions(_this.data.openID)
      }
    })
  },
  onLoad: function (options) {
    console.log("index.js onLoad")
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
        console.log("onload, app.globalData is set via callback");
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
      url: '../voting/voting?session=' + JSON.stringify(session)
    })
  },

  // 点击 往期投票
  pastVoteTapped: function (res) { 
    var session = this.data.expiredSessions[res.currentTarget.dataset.id];
    wx.navigateTo({
      url: '../voting/voting?session=' + JSON.stringify(session)
    })
  }
})

function fetchSessions(openid) {
  wx.showLoading({ title: '' });
  var query = new Bmob.Query(bmob_session);
  // query.contains('openIDs', openid);
  query.find({
    success: function(res) {
      wx.hideLoading()
      var validSessions = [];
      var expiredSessions = [];

      for(var index in res) {
        var session = res[index];
        var localSession = new Objects.Session(
          session.id, 
          session.attributes.deadlineTimeMiliSec,
          session.attributes.title,
          session.attributes.voteIDs,
          session.attributes.openIDs,
          session.attributes.creatorOpenID,
          null)
        var date = new Date();

        if (Helper.isSessionExpired(session.attributes.deadlineTimeMiliSec)) {
          localSession.expired = true
          expiredSessions.push(localSession);
        } else {
          localSession.expired = false
          validSessions.push(localSession);
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