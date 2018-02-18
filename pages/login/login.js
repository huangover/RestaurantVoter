const app = getApp()

function goToIndex() {
  wx.redirectTo({
    url: '../voting/voting',
  })
}

function showAuthFail() {
  wx.showToast({
    title: '授权失败，无法使用小程序',
    icon: 'none'
  })
}

function showLoginFail() {
  wx.showToast({
    title: '登陆失败，请重试',
    icon: 'none'
  })
}

function showReAuthModal() {
  // 拒绝授权，引导用户去打开授权
  wx.showModal({
    title: '授权失败',
    content: '小程序需要获取您的头像和昵称才可正常使用，是否打开授权？',
    confirmText: '前往授权',
    success: res => {
      if (res.confirm) {
        wx.openSetting({})
      }
    }
  })
}

function getUserInfo() {
  wx.getUserInfo({
    success: function (res) {
      app.globalData.userInfo = res.userInfo;
      goToIndex()
    },
    fail: res => {
      showAuthFail()
    }
  })
}

function getAuthSetting() {
  wx.getSetting({
    success: res => {
      var userInfo = res.authSetting['scope.userInfo'];

      if (userInfo != null) { // 以前弹出过授权对话框
        if (userInfo) {
          // 已经授权
          goToIndex()
        } else {
          // 拒绝授权，引导用户去打开授权
          showReAuthModal()
        }
      } else { // 以前未弹出过授权对话框
        getUserInfo()
      }
    }
  })
}

function logIn() {
  wx.login({
    success: res => {
      getAuthSetting()
    },
    fail: res => {
      wx.hideLoading()
      showLoginFail()
    }
  })
}

Page({
  onShow: function () {
    wx.showToast({
      title: '登陆中',
      icon: 'loading',
      duration: 2000,
      complete: res => {
        logIn()
      }
    })
  }
})