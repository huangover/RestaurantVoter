//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    createNewRestaurantTitle: '或新建餐厅选项',
    restaurantListTitle: '选择一个餐厅',
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    votes:['重庆火锅','砂锅粥','星怡会'],
    participants: [{ name: 'Tom', zIndex: 0 }, 
      { name: 'Jerry', zIndex: 1 }, 
      { name: 'Jax', zIndex: 2 }, 
      { name: 'Katy', zIndex: 3 }, 
      { name: 'Lucy', zIndex: 4 }],
    addBtnTitle: "添加",
    zIndex:0
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  restaurantTapped: function() {
    
  },
  addButtonTapped: function() {
    // this.setData({participants:["小红"]})
    this.data.participants.push("小红")
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
