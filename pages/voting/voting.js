const app = getApp()

var Objects = require('../../utils/objects.js')
var Bmob = require('../../utils/bmob.js')
var bmod_vote = Bmob.Object.extend('Vote')
var bmod_session = Bmob.Object.extend('Session')
var bmod_voter = Bmob.Object.extend('Voter')
var BmobSocketIo = require('../../utils/bmobSocketIo.js').BmobSocketIo
var Helper = require('../../utils/helper.js')
var cellHighlightColor = '#1E90FF'
var cellDefaultColor = 'white'

var _this
var voteUpdateCallback
var sessionUpdateCallback
var _logInCompleteCallback

Page({
  data: {
    isFromShare: false,
    deadline: null,
    session: null,
    votes: null,
    avatarUrls: null,
    indexOfCellVoted: null,
    cellBackgroundColors: null,
    maxVoteCount: null,
    hasUniqueWinner: null,
    isSessionCreator: false
  },
  onLoad: function (options) {
    _this = this
    _this.setData({ isFromShare: options.sessionID != null })

    if (_this.data.isFromShare) {
      // 从分享小程序过来，需要获取sessionId，然后通过bmob获取session信息，再fetch votes
      console.log("open 小程序 from share, and options is")
      console.log(options)
      getOpenID(function (openID) {
        var query = new Bmob.Query(bmod_session)
        query.get(options.sessionID, {
          success: res => {
            //把打开该页面的用户加入到openIDs中
            res.fetchWhenSave(true)
            if (!res.attributes.openIDs.includes(openID)) {
              res.addUnique('openIDs', openID)
            }
            res.save()
            
            handleInitialSessionData(
              res.objectId,
              res.attributes.deadlineString,
              res.attributes.title,
              res.attributes.voteIDs,
              res.attributes.openIDs,
              res.attributes.openIDs.includes(openID),
              Helper.isSessionExpired(res.attributes.deadlineString))
          },
          error: error => {
            console.log("votings.js fetch session with id fail")
          }
        })
      })
    } else {
      // 从index.js过来的
      var session = JSON.parse(options.session)
      handleInitialSessionData(
        session.objectId,
        session.deadlineString,
        session.title,
        session.voteIDs,
        session.openIDs,
        session.openIDs.includes(app.globalData.openID),
        session.expired)
    }
  },
  onShow: function() {
    // Vote web socket callback
    voteUpdateCallback = res => {
      for (var i in _this.data.votes) {
        var vote = _this.data.votes[i]
        if (vote.objectId == res.objectId) {
          vote.count = res.count
        }
      }
      _this.setData({ votes: _this.data.votes })
    }
    app.voteUpdateCallback = voteUpdateCallback

    // Session web socket callback
    sessionUpdateCallback = res => {
      if (res.objectId == _this.data.session.objectId) {
        var isExpired = Helper.isSessionExpired(res.deadlineString)
        _this.data.session.expired = isExpired
        _this.setData({ session: _this.data.session })
      }
    }
    app.sessionUpdateCallback = sessionUpdateCallback
  },
  onHide: function() {
    voteUpdateCallback = null
    sessionUpdateCallback = null
  },
  onShareAppMessage: function () {
    return {
      title: '收到一个投票邀请',
      desc: _this.data.session.title,
      path: '/pages/voting/voting?sessionID=' + _this.data.session.objectId,
    }
  },
  cellTapped: function (res) {
    if (_this.data.session.expired) { return }
    // res.currentTarget.dataset.id是cell的index
    var index = res.currentTarget.dataset.id
    wx.setStorage({
      key: _this.data.session.objectId,
      data: _this.data.votes[index].objectId,
    })
    saveVote(
      _this.data.indexOfCellVoted,
      index)
    updateCellBgColorAtIndex(res.currentTarget.dataset.id)
  },
  addButtonTapped: function () {
    _this.setData({ modalHidden: false })
  },
  reVoteButtonTapped: function () {
    // 挑出票数最高的几个，清空票数，并且删除剩下的选项，然后重新加载页面
    var result = _this.data.votes.filter(function (v) { return v.count == _this.data.maxVoteCount })
  },
  endVoteButtonTapped: function() {
    //改session的endDate，把expired设为default
    var query = new Bmob.Query(bmod_session)
    query.get(_this.data.session.objectId, {
      success: res => {
        res.set('deadlineString', new Date().toISOString())
        res.save()

        _this.data.session.expired = true
        _this.setData({ session: _this.data.session})

        //这样子被过期的session可以reload从而正常显示
        wx.setStorage({
          key: 'indexPageShouldReload',
          data: true,
        })
      },
      error: function(result, error) {}
    })
  }
})

function handleInitialSessionData(id, deadlineString, title, voteIDs, openIDs, isSessionCreator, expired) {
  var localSession = new Objects.Session(id, deadlineString, title, voteIDs, openIDs)
  localSession.expired = expired
  _this.setData({
    session: localSession
  })

  // 是否session的创建者，决定是否显示结束投票按键
  _this.setData({ isSessionCreator: isSessionCreator })

  fetchVotes(function () {

    if (_this.data.expired) {
      // 计算winner，如果有并列第一，那么需要显示二次投票选项
      var result = _this.data.votes.filter(function(v){ return v.count == _this.data.maxVoteCount})
      // 如果只有一个选项并且这个选项的vote count不为0 OR
      // 有多个选项，并且拥有最高票数的选项只有一个
      var hasUniqueWinner = (result == 1 && _this.data.votes.length != 1) ||
        (_this.data.maxVoteCount != 0 && _this.data.votes.length == 1)
      _this.setData({ hasUniqueWinner: hasUniqueWinner})
    } else {
      //highlight用户之前选中的选项，如果有的话
      wx.getStorage({
        key: _this.data.session.objectId,
        success: function (res) {
          for (var index in _this.data.votes) {
            if (_this.data.votes[index].objectId == res.data) {
              _this.data.indexOfCellVoted = index // 需初始化，用户更新选项时count才不会出错
              updateCellBgColorAtIndex(index)
              break
            }
          }
        },
      })
    }
  })

  loadAvatars(openIDs)
}
function loadAvatars(openIDs) {
  
  var query = new Bmob.Query(bmod_voter)
  query.containedIn('openID', openIDs)
  query.ascending('createdAt')
  query.find({
    success: results => {
      var avatarUrls = results.map(function (res) { return res.attributes.avatarUrl })
      _this.setData({ avatarUrls: avatarUrls })
    },
    error: error => {
      console.log("Get voters with openIDs failed")
    }
  })
}

function fetchVotes(success) {
  if (_this.data.session.voteIDs == null || _this.data.session.voteIDs.length == 0) {
    console.log('cannot fetch empty voteIDs')
    return
  }

  var query = new Bmob.Query(bmod_vote)
  query.ascending('createdAt')
  query.containedIn('objectId', _this.data.session.voteIDs).find({
    success: res => {
      var votes = []
      var colors = []
      var maxVoteCount = 0

      for (var index in res) {
        var localVote = new Objects.Vote(res[index].attributes.name, res[index].attributes.count, res[index].id) 
        votes.push(localVote)
        colors.push(cellDefaultColor)
        maxVoteCount = Math.max(maxVoteCount, localVote.count)
      }
      _this.setData({ votes: votes, cellBackgroundColors: colors, maxVoteCount: maxVoteCount })
      success()
    },
    error: error => {
      console.log("Fetch votes with error:")
      console.log(error)
    }
  })
}

function updateCellBgColorAtIndex(index) {
  for (var i in _this.data.cellBackgroundColors) {
    _this.data.cellBackgroundColors[i] = i == index ? cellHighlightColor : cellDefaultColor
  }
  _this.setData({ cellBackgroundColors: _this.data.cellBackgroundColors })
}

function saveVote(oldIndex, newIndex) {
  if (oldIndex != null) {
    // 更改选项，老选项count减一，再把新选项的count加一
    var oldLocalVote = _this.data.votes[oldIndex]
    updateBmobVote(oldLocalVote.objectId, false, function () {
      saveNewVote(newIndex)
    })
  } else {
    // 新选项的count加一
    saveNewVote(newIndex)
  }
}

function updateBmobVote(objectId, isIncrease, success, failure) {

  var query = new Bmob.Query(bmod_vote)
  query.get(objectId, {
    success: res => {
      res.set('count', res.attributes.count + (isIncrease ? 1 : -1))
      res.save()
      if (success) {
        success()
      }
    },
    error: error => {
      wx.showModal({
        title: '',
        content: '保存失败，请重试',
        showCancel: false
      })
      updateCellBgColorAtIndex(-1)//传-1进去，所有cell背景色恢复白色
      _this.setData({ indexOfCellVoted: null })
      failure()
    }
  })
}

function saveNewVote(newIndex) {
  var newLocalVote = _this.data.votes[newIndex]
  updateBmobVote(newLocalVote.objectId, true, function () {
    _this.setData({ indexOfCellVoted: newIndex })
  })
}

function highlightWinningVotes() {
  var hasUniqueWinner = 0
  for (var i in _this.data.votes) {
    if (_this.data.votes[i].count == _this.data.maxVoteCount) {
      _this.data.cellBackgroundColors[i] = cellHighlightColor
      hasUniqueWinner = hasUniqueWinner + 1
    }
  }
  _this.setData({
    cellBackgroundColors: _this.data.cellBackgroundColors,
    hasUniqueWinner: (hasUniqueWinner == 1)
  })
}

function getOpenID(success) {
  
  if (app.globalData.openID) {
    console.log("voting.js on load, app.globalData is already set")
    _this.setData({ openID: app.globalData.openID })
    success(app.globalData.openID)
  } else {
    _logInCompleteCallback = res => {
      console.log("voting.js _logInCompleteCallback 呼叫，开始fetchSessions with openID: ")
      console.log(res)
      _this.setData({ openID: res })
      success(res)
    }
    app.logInCompleteCallback = _logInCompleteCallback
  }
}
/* 
1. 创建：
要把创建者的openid存在Session的voteIDs和creatorOpenId字段

2. 从index.js过来，有Session的信息，只需要通过voteIDs来fetchVotes

3. 从分享过来，通过options.sessionID获取Session，再进一步通过voteIDs来fetchVotes。同时要把打开该页面的用户的openid加入到Session的openIDs字段（去重）
*/