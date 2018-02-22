// TO-DO: 1. 如果已经截止，不允许投票
const app = getApp()
var Bmob = require('../../utils/bmob.js');
var _this;
var _voteObjectName = 'Vote';
var bmod_vote = Bmob.Object.extend(_voteObjectName);
var session;
var cellHighlightColor = '#1E90FF';
var cellDefaultColor = 'white';
Page({
  data: {
    deadline: null,
    title: null,
    voteIDs: null,
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
  },
  onLoad: function (options) {
    _this = this;

    // 从index.js过来的
    var session = JSON.parse(options.session)
    createDeadlineString(session.deadlineTimeMiliSec)
    this.setData({
      title: session.title,
      voteIDs: session.voteIDs,
      expired: options.expired
    })
    // 从分享小程序过来，需要获取sessionId，然后通过bmob获取信息
    
    fetchVotes(function(){
      // if (options.expired) {
        highlightWinningVotes();
      // }
    });
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
    this.setData({ modalHidden: false})
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

// 函数
function createDeadlineString(deadlineTimeMiliSec) {
  var date = new Date(deadlineTimeMiliSec);
  console.log(date);
  console.log((date.getMonth() + 1).toString());
  var dateString = date.getFullYear().toString()+"-"+(date.getMonth()+1).toString()+"-"+date.getDate().toString() + " " + date.getHours().toString() + ":" + date.getMinutes().toString();
  _this.setData({ deadline : dateString});
}

function fetchVotes(success) {
  if (_this.data.voteIDs == null || _this.data.voteIDs.length == 0) {
    console.log('cannot fetch empty voteIDs')
    return;
  }

  var query = new Bmob.Query(bmod_vote);
  query.containedIn('objectId', _this.data.voteIDs).find({
    success: res => {
      var votes = [];
      var colors = [];
      var maxVoteCount = 0;
      
      for(var index in res) {
        var localVote = new Vote(res[index].attributes.name, res[index].attributes.count, res[index].id);
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

//定义类
function Vote(_name, _count, _objectId) {
  var _this = this;
  _this.count = null;
  _this.name = null;
  _this.objectId = null;

  var init = function () {
    _this.name = _name;
    _this.count = _count;
    _this.objectId = _objectId;
  };

  init();
}