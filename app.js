var _this;
var _Bmob;
var Bmob_User_Name = "Voter";
var User;

App({  
  onLaunch: function () {

    var Bmob = require('utils/bmob.js');
    Bmob.initialize("f26e061cda423a4fb1d09e177364b89b", "0558112a3cc77cae01374a324564e1c6");
    _Bmob = Bmob;
    User = Bmob.Object.extend(Bmob_User_Name);
    _this = this;
    logIn();
  },
  globalData: {
    userInfo: null,
    openID: null
  }
})

/* 登录所需要的方法 */
function logIn() {
  // 如果已经有openID，就不要再去request
  wx.getStorage({
    key: 'openID',
    success: function (res) {
      console.log("Get openID from db success");
      _this.globalData.openID = res.data;
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

      if (_this.getOpenIDCallback) {
        _this.getOpenIDCallback(userData.openid);
      } else {
        console.log("getOpenIDCallback is not implemented");
      }

      wx.setStorage({
        key: "openID",
        data: userData.openid
      })
      _this.globalData.openID = userData.openid;

      var user = new User();
      user.set("openID", userData.openid);
      user.save(null, {
        success: res=> {
          console.log("Bmob create user success");
          success();
        },
        error: function(result, error) {
          console.log("Fail to create User object with error");
          console.log(error);
        }
      });
    },
    error: function (error) {
      // Show the error message somewhere
      console.log("Error: " + error.code + " " + error.message);
    }
  });
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
      console.log("Get user info success");
      var userInfo = res.userInfo;
      _this.globalData.userInfo = userInfo;

      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      // index.js实现了userInfoReadyCallback
      if (_this.userInfoReadyCallback) {
        _this.userInfoReadyCallback(res)
      } else {
        console.log("index.js没有实现userInfoReadyCallback回调");
      }

      //更新/第一次填写用户的信息
      var query = new _Bmob.Query(User);
      query.equalTo('openid', _this.globalData.openID);
      query.find({
        success: results=> {
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
        error: function(result, error) {
          console.log("failed to retrieve User with openID" + _this.globalData.openID);
        }
      });
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