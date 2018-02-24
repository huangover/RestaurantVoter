const app = getApp()

var Objects = require('../../utils/objects.js');
var Bmob = require('../../utils/bmob.js');

var bmod_vote = Bmob.Object.extend('Vote');
var bmod_session = Bmob.Object.extend('Session');

var cellHighlightColor = '#1E90FF';
var cellDefaultColor = 'white';

var _this;

Page({
  data: {
    isFromShare: false,
    deadline: null,
    session: null,
    expired: null,
    votes:null,
    indexOfCellVoted:null,
    cellBackgroundColors:null,
    maxVoteCount: null,
    hasUniqueWinner: null,
    participants: [{ name: 'Tom', zIndex: 0 },
    { name: 'Jerry', zIndex: 1 },
    { name: 'Jax', zIndex: 2 },
    { name: 'Katy', zIndex: 3 },
    { name: 'Lucy', zIndex: 4 }],
    shareData: {
      title: '自定义分享标题',
      desc: '自定义分享描述',
      path: '/pages/voting/voting'
    }
  },
  onLoad: function (options) {
    console.log("voting.js onload, and options is ");
    console.log(options);

    _this = this;
    _this.setData({ isFromShare: options.sessionID != null });

    if (_this.data.isFromShare) {
      getOpenID(function (openID)  {
        
        console.log("votins.js get openID success, openID is:");
        console.log(openID);
        // 从分享小程序过来，需要获取sessionId，然后通过bmob获取session信息，再fetch votes
        var query = new Bmob.Query(bmod_session);
        query.get(options.sessionID, {
          success: res => {
            console.log("votings.js fetch session with id success");
            console.log(res);

            //把打开该页面的用户加入到openIDs中
            var openIDs = null;
            if (res.attributes.openIDs) {
              openIDs = res.attributes.openIDs;
              openIDs.push(openID);//去重还没做
            } else {
              openIDs = [openID];
            }
            console.log("Session.openIDs is");
            console.log(openIDs);
            res.set('openIDs', openIDs);
            res.save();

            //创建本地的Session对象
            var localSession = new Objects.Session(
              res.id,
              res.attributes.deadlineTimeMiliSec,
              res.attributes.title,
              res.attributes.voteIDs)
            _this.setData({
              session: localSession,
              expired: false
            })
          },
          error: error => {
            console.log("votings.js fetch session with id fail");
          }
        });
      });
    } else {
      // 从index.js过来的
      var session = JSON.parse(options.session)
      var localSession = new Objects.Session(
        session.id,
        session.deadlineTimeMiliSec,
        session.title,
        session.voteIDs)
      console.log("session.voteIDs");  
      console.log(session.voteIDs);
      console.log("localsession.voteIDs");
      console.log(localSession.voteIDs);
      _this.setData({
        session: localSession,
        expired: options.expired
      })

      fetchVotes(function () {
        // if (options.expired) {
        highlightWinningVotes();
        // }
      });
    }
  },
  onShareAppMessage: function () {
    // title 要写xxx邀请你投票
    // return this.data.shareData
    return {
      title: '收到一个投票邀请',
      desc: _this.data.session.title,
      path: '/pages/voting/voting?sessionID=' + _this.data.session.id,
    }
  },
  cellTapped: function(res) {
    if (_this.data.expired) {return;}
    // res.currentTarget.dataset.id是cell的index
    saveVote(
      _this.data.indexOfCellVoted,
      res.currentTarget.dataset.id);
    updateCellBgColorAtIndex(res.currentTarget.dataset.id);
  },
  addButtonTapped: function() {
    _this.setData({ modalHidden: false})
  },
  reVoteButtonTapped: function() {
    // 挑出票数最高的几个，清空票数，并且删除剩下的选项，然后重新加载页面
  }
  // getUserInfo: function(e) {
  //   console.log(e)
  //   app.globalData.userInfo = e.detail.userInfo
  //   this.setData({
  //     userInfo: e.detail.userInfo,
  //     hasUserInfo: true
  //   })
  // }
})

function fetchVotes(success) {
  if (_this.data.session.voteIDs == null || _this.data.session.voteIDs.length == 0) {
    console.log('cannot fetch empty voteIDs')
    return;
  }

  var query = new Bmob.Query(bmod_vote);
  query.containedIn('objectId', _this.data.session.voteIDs).find({
    success: res => {
      var votes = [];
      var colors = [];
      var maxVoteCount = 0;
      
      for(var index in res) {
        var localVote = new Objects.Vote(res[index].attributes.name, res[index].attributes.count, res[index].id);
        votes.push(localVote);
        colors.push(cellDefaultColor);
        maxVoteCount = Math.max(maxVoteCount, localVote.count)
      }
      _this.setData({ votes: votes, cellBackgroundColors: colors, maxVoteCount: maxVoteCount});
      success();
    },
    error: error => {
      console.log(error);
    }
  });
}

function updateCellBgColorAtIndex(index) {
  for (var i in _this.data.cellBackgroundColors) {
    _this.data.cellBackgroundColors[i] = i == index ? cellHighlightColor : cellDefaultColor;
  }
  _this.setData({ cellBackgroundColors: _this.data.cellBackgroundColors });
}

function saveVote(oldIndex, newIndex) {
  if (oldIndex != null) {
    var oldLocalVote = _this.data.votes[oldIndex];
    updateBmobVote(oldLocalVote.objectId, false, function () {
      saveNewVote(newIndex);
    });
  } else {
    saveNewVote(newIndex);
  }
}

function updateBmobVote(objectId, isIncrease, success, failure) {
  
  var query = new Bmob.Query(bmod_vote);
  query.get(objectId, {
    success: res => {
      res.set('count', res.attributes.count + (isIncrease ? 1 : -1));
      res.save();
      if (success) {
        success();
      }
    },
    error: error => {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
      updateCellBgColorAtIndex(-1);//传-1进去，所有cell背景色恢复白色
      _this.setData({ indexOfCellVoted: null });
      failure();
    }
  });
}

function saveNewVote(newIndex) {
  var newLocalVote = _this.data.votes[newIndex];
  updateBmobVote(newLocalVote.objectId, true, function () {
    _this.setData({ indexOfCellVoted: newIndex });
  });
}

function highlightWinningVotes() {
  var hasUniqueWinner = 0;
  for(var i in _this.data.votes) {
      if (_this.data.votes[i].count == _this.data.maxVoteCount) {
        _this.data.cellBackgroundColors[i] = cellHighlightColor;
        hasUniqueWinner = hasUniqueWinner + 1;
      }
  }
  _this.setData({ 
    cellBackgroundColors: _this.data.cellBackgroundColors,
    hasUniqueWinner: (hasUniqueWinner == 1) });
}

function getOpenID(success) {
  if (app.globalData.openID) {
    console.log("voting.js on load, app.globalData is already set");
    _this.setData({ openID: app.globalData.openID });
    success(app.globalData.openID);
  } else {
    app.getOpenIDCallback = res => {
      console.log("voting.js onload, app.globalData is set via callback");
      _this.setData({ openID: res });
      success(res)
    }
  }
}

/* 
1. 创建：
要把创建者的openid存在Session的voteIDs和creatorOpenId字段

2. 从index.js过来，有Session的信息，只需要通过voteIDs来fetchVotes

3. 从分享过来，通过options.sessionID获取Session，再进一步通过voteIDs来fetchVotes。同时要把打开该页面的用户的openid加入到Session的openIDs字段（去重）
*/