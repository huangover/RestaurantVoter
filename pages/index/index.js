const app = getApp()

var Objects = require('../../utils/objects.js')
var Helper = require('../../utils/helper.js')
var Bmob = require('../../utils/bmob.js')
var _sessionObjectName = 'Session'
var bmob_session = Bmob.Object.extend(_sessionObjectName)

var _logInCompleteCallback
var _this

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
    _this = this

    if (app.globalData.openID) {
      console.log("index.js 从app.globalData获取openID")
      _this.setData({ openID: app.globalData.openID })
      fetchSessions(app.globalData.openID)
    } else {
      _logInCompleteCallback = res => {
        console.log("index.js _logInCompleteCallback 呼叫，开始fetchSessions with openID: ")
        console.log(res)
        _this.setData({ openID: res })
        fetchSessions(res)
      }
      app.logInCompleteCallback = _logInCompleteCallback
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
    var session = this.data.validSessions[res.currentTarget.dataset.id]
    
    wx.navigateTo({
      url: '../voting/voting?session=' + JSON.stringify(session)
    })
  },

  // 点击 往期投票
  pastVoteTapped: function (res) { 
    var session = this.data.expiredSessions[res.currentTarget.dataset.id]
    wx.navigateTo({
      url: '../voting/voting?session=' + JSON.stringify(session)
    })
  }
})

function fetchSessions(openid) {
  wx.showLoading({ title: '' })
  var query = new Bmob.Query(bmob_session)
  query.containedIn('openIDs', [openid])
  query.find({
    success: function(res) {
      wx.hideLoading()
      var validSessions = []
      var expiredSessions = []
      
      for(var index in res) {
        var session = res[index]
        //Session(objectId, deadlineString, title, voteIDs, openIDs, creatorOpenID, expired)
        var localSession = new Objects.Session(
          session.id, 
          session.attributes.deadlineString,
          session.attributes.title,
          session.attributes.voteIDs,
          session.attributes.openIDs,
          session.attributes.creatorOpenID,
          Helper.isSessionExpired(session.attributes.deadlineString))
        var date = new Date()

        if (Helper.isSessionExpired(session.attributes.deadlineString)) {
          localSession.expired = true
          expiredSessions.push(localSession)
        } else {
          localSession.expired = false
          validSessions.push(localSession)
        }
      }
      _this.setData({ 
        validSessions: validSessions, 
        expiredSessions: expiredSessions, 
        hideExpiredSessionView: expiredSessions.length == 0, 
        hideValidSessionView: validSessions.length == 0})
    },
    error: res=> {
      wx.hideLoading()
      wx.showModal({
        title: '',
        content: '获取数据错误，请重试',
        showCancel: false
      })
    }
  })
}