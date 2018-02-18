var _this;
var Bmob = require('../../utils/bmob.js');
var _voteObjectName = 'Vote';
var _sessionObjectName = 'Session';
var bmob_vote = Bmob.Object.extend(_voteObjectName);
var bmob_session = Bmob.Object.extend(_sessionObjectName);

Page({

  /**
   * 页面的初始数据
   */
  data: {
    validSessions: null,
    expiredSessions: null,
    hideExpiredSessionView: true,
    hideValidSessionView: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    _this = this;
    fetchSessions();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },


  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

  /* 用户点击时间 */

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

function fetchSessions() {

  var now = new Date();
  var nowDateStr = now.getFullYear().toString() + "-" + now.getMonth().toString() + "-" + now.getDate().toString();
  var nowTimeStr = now.getHours().toString() + ":" + now.getMinutes().toString();
  var nowStr = nowDateStr + " " + nowTimeStr;
  var nowMilSeconds = Date.parse(nowStr);

  wx.showLoading({
    title: '',
  })
  var query = new Bmob.Query(bmob_session);
  query.find({
    success: res=> {
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
        title: '获取数据错误，请重试'
      })
    }
  });
}