var _this;
var _Bmob;
var Bmob_Voter_Name = "Voter";
var Voter;
const bmobSocketIo = require('utils/bmobSocketIo.js')
var _socketIo


App({ 
  onShow: function() {
    // initWebSocket() //SDK还没有支持disconnect socket，支持了以后uncomment这里
    logIn()
  },
  onHide: function() {
    // disconnectSocket() //SDK还没有支持disconnect socket，支持了以后uncomment这里
  },
  onLaunch: function () {
    initBmobDataService()
    _this = this
    _socketIo = new bmobSocketIo('f26e061cda423a4fb1d09e177364b89b');
    initWebSocket() //SDK还没有支持disconnect socket，支持了以后comment这里
  },
  globalData: {
    userInfo: null,
    openID: null
  }
})

function initBmobDataService() {
  var Bmob = require('utils/bmob.js');
  Bmob.initialize("f26e061cda423a4fb1d09e177364b89b", "0558112a3cc77cae01374a324564e1c6")
  _Bmob = Bmob;
  Voter = Bmob.Object.extend(Bmob_Voter_Name);
}

function disconnectSocket() {
  _socketIo.unsubUpdateTable('Vote')
  _socketIo.unsubUpdateTable('Session')
  // _socketIo.obj.socket.disconnect()
  _socketIo = null
}

function initWebSocket() {
  _socketIo.initialize()
  _socketIo.onInitListen = function () {
    _socketIo.updateTable("Vote")
    _socketIo.updateTable("Session")
  }
  _socketIo.onUpdateTable = function (tablename, data) {
    console.log("BmobSocket update:")
    console.log("tablename is: " + tablename + " data is " + data)
    if (tablename == 'Vote') {
      if (_this.voteUpdateCallback) {
        _this.voteUpdateCallback(data)
      } else {
        console.log("Vote object updated on backend, but voteUpdateCallback callback not implemented")
      }
    }
    if (tablename == 'Session') {
      if (_this.sessionUpdateCallback) {
        _this.sessionUpdateCallback(data)
      } else {
        console.log("Session object updated on backend, but sessionUpdateCallback callback not implemented")
      }
    }
  };
}

/* 登录所需要的方法 */
function logIn() {
  // 如果已经有openID，就不要再去request
  wx.getStorage({
    key: 'openID',
    success: function (res) {
      console.log("Get openID from db success");
      // _this.globalData.openID = res.data;
      getAuthSetting();
    },
    fail: function (error) {
      console.log("Get openID from db fail");
      wx.login({
        success: res => {
          console.log("wx login success");
          getOpenId(res.code, function () {
            getAuthSetting();
          });
        },
        fail: res => {
          showLoginFail()
        }
      })
    }
  });
}

function getOpenId(code, success) {
  _Bmob.User.requestOpenId(code, {//获取userData(根据个人的需要，如果需要获取userData的需要在应用密钥中配置你的微信小程序AppId和AppSecret，且在你的项目中要填写你的appId)
    success: function (userData) {
      console.log("Bmob get openID success");
      wx.setStorage({
        key: "openID",
        data: userData.openid
      })
      
      // 找是否已经创建过这个voter
      var query = new Bmob.Query(Voter)
      query.equalTo('openID', userData.openid)
      query.find({
        success: results => {
          console.log("This voter already exists on Bmob")
          success()
        },
        error: error => {
          console.log("This voter is new, create Voter object on Bmob")

          var voter = new Voter()
          voter.set("openID", userData.openid)
          voter.save(null, {
            success: res => {
              console.log("Bmob create user success")
              success()
            },
            error: function (result, error) {
              console.log("Fail to create User object with error")
              console.log(error)
            }
          });
        }
      })
    },
    error: function (error) {
      // Show the error message somewhere
      console.log("Error: " + error.code + " " + error.message);
    }
  });
}

function showAuthFail() {
  wx.showModal({
    title: '',
    content: '授权失败，无法使用小程序',
    showCancel: false
  })
}

function showLoginFail() {
  wx.showModal({
    title: '',
    content: '登陆失败，请重试',
    showCancel: false
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
      console.log("Get user info success");
      var userInfo = res.userInfo;
      _this.globalData.userInfo = userInfo;

      // 统一在这里给_this.globalData.openID赋值，照顾授权失败的情况
      wx.getStorage({
        key: 'openID',
        success: function (res) {
          var openID = res.data

          _this.globalData.openID = openID//当index.js的onLoad比这句话执行晚的时候
          if (_this.logInCompleteCallback) {
            _this.logInCompleteCallback(openID)//当index.js的onLoad比这句话执行早的时候
          }

          //更新/第一次填写用户的信息
          var query = new _Bmob.Query(Voter);
          query.equalTo('openID', openID);
          query.find({
            success: results => {
              for (var i in results) {
                var res = results[i];
                res.set("avatarUrl", userInfo.avatarUrl);
                res.set("city", userInfo.city);
                res.set("country", userInfo.country);
                res.set("gender", userInfo.gender);
                res.set("province", userInfo.province);
                res.set("username", userInfo.nickName);
                res.save();
              }
            },
            error: function (result, error) {
              console.log("failed to retrieve User with openID" + _this.globalData.openID);
            }
          })

        }
      })
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
          // 以前已经授权
          getUserInfo();
        } else {
          // 以前拒绝授权，引导用户去打开授权
          showReAuthModal()
        }
      } else { // 以前未弹出过授权对话框
        getUserInfo()
      }
    }
  })
}

/*

1、本地是否存有openID：
  有：去2，是否有授权userinfo
  无：呼叫login/getopenID，获取openID
    成功：去2，是否有授权userinfo
    失败：处理失败，无法正常继续

2、是否有授权userinfo记录
  无：去3，呼叫getUserInfo
  有：是否同意授权
    是：去3，呼叫getUserInfo
    否：引导用户打开设置页，问是否重新授权
      是：去3，呼叫getUserInfo
      否：提示错误

3、呼叫getUserInfo，是否授权
  是：继续，获取/更新avatarurl
  否：无法继续，告知用户可以在设置中重新打开授权
 */