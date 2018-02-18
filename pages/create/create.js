// pages/create/create.js

var Bmob = require('../../utils/bmob.js');
var _this;
var _voteObjectName = 'Vote';
var _sessionObjectName = 'Session';
var bmod_vote = Bmob.Object.extend(_voteObjectName);
var bmod_session = Bmob.Object.extend(_sessionObjectName);

Page({
  data: {
    inputType:'text',
    votes:[],
    modalHidden: true,
    deadlineDate: "",
    deadlineTime: "",
    newVoteValue: "",
    sessionTitle: "",
    sessionDescription: "",
  },
  onLoad: function (options) {
    _this = this;
    var date = new Date();
    var deadlineDate = date.getFullYear().toString() +"-"+ (date.getMonth()+1).toString() + "-"+date.getDate().toString();
    var deadlineTime = date.getHours().toString() + ":" +date.getMinutes().toString();
    this.setData({ deadlineDate: deadlineDate, deadlineTime: deadlineTime});
  },
  onShareAppMessage: function () {
  
  },

  // 用户事件
  finishButtonTapped: function(res) {
    if (!checkValidTitle()) {
      return;
    }
    if (!checkValidItems()) { 
      return ;
    }
    if (!checkValidDeadline()) {
      return;
    }
    saveAll();
  },

  deleteButtonTapped: function(res) {
    var index = res.currentTarget.dataset.id;
    this.data.votes.splice(index, 1);
    this.setData({votes: this.data.votes});
  },
  addButtonTapped: function() { 
    this.setData({newVoteValue : ""});//clear previous state
    this.setData({ modalHidden: false })
  },
  dateInputTapped: function() {
    console.log("date input tapped");
    this.setData({datePickerHidden: false});
  },
  timeInputTapped: function () { 
    console.log("time input tapped");
    this.setData({timePickerHidden: false });
  },
  onModalCancel: function() {
    this.setData({ modalHidden: true, inputValue: ''});
  },
  onModalConfirm: function() {
    console.log(this.data.inputValue)
    this.data.votes.push(this.data.inputValue);
    this.setData({ votes: this.data.votes, modalHidden: true, inputValue: ''});
    console.log(this.data)
  },
  // input输入
  newVoteChanged: function (res) {
    this.setData({ inputValue: res.detail.value })
  },
  titleChanged: function(res) {
    this.setData({ sessionTitle: res.detail.value });
  },
  descriptionChanged: function(res) {
    this.setData({ sessionDescription: res.detail.value });
  },

  // 选择器
  timePickerValueChanged: function(res) {
    console.log(res);
    this.setData({ deadlineTime: res.detail.value});
  },
  datePickerValueChanged: function (res) { 
    console.log(res);
    this.setData({ deadlineDate: res.detail.value});
  }
})

function checkValidTitle() { 
  if (_this.data.sessionTitle == "") {
    wx.showToast({
      title: '请输入标题',
      icon: 'none'
    });
    return false;
  }

  return true;
}

function checkValidItems() {
  if (_this.data.votes.length == 0) {
    wx.showToast({
      title: '请添加至少一个选项',
      icon: 'none'
    })

    return false;
  }

  return true;
}

function checkValidDeadline() {
  var timeStr = _this.data.deadlineDate + " " + _this.data.deadlineTime;
  var deadlineMilSeconds = Date.parse(timeStr);

  var now = new Date();
  var nowDateStr = now.getFullYear().toString() + "-" + now.getMonth().toString() + "-" + now.getDate().toString();
  var nowTimeStr = now.getHours().toString() + ":" + now.getMinutes().toString();
  var nowStr = nowDateStr + " " + nowTimeStr;
  var nowMilSeconds = Date.parse(nowStr);

  if (deadlineMilSeconds < nowMilSeconds) {
    wx.showToast({
      title: '截止日期时间不能小于当前的日期时间',
      icon: 'none'
    });

    return false;
  }

  return true;
}

function saveAll() {

  wx.showLoading({
    title: '',
  })

  var voteObjects = [];
  for (var index in _this.data.votes) {
    var newVote = new bmod_vote();
    newVote.set('name', _this.data.votes[index]);
    newVote.set('count', 0);
    voteObjects.push(newVote);
  }

  Bmob.Object.saveAll(voteObjects).then(
    function (objects) {
      var voteIDs = [];
      for (var index in objects) {
        voteIDs.push(objects[index].id);
      }

      var timeStr = _this.data.deadlineDate + " " + _this.data.deadlineTime;
      var deadlineMilSeconds = Date.parse(timeStr);

      //创建session
      var newSession = new bmod_session()
      newSession.set('title', _this.data.sessionTitle);
      newSession.set('description', _this.data.description);
      newSession.set('deadlineTimeMiliSec', deadlineMilSeconds);
      newSession.set('voteIDs', voteIDs);
      newSession.save(null, {
        success: res => {
        wx.hideLoading()
          wx.showToast({
            title: '创建成功',
            icon: 'success',
            complete: res=> {
              setTimeout(function () {
                wx.navigateBack({})
              }, 1200)
            }
          })
        },
        error: function (newSession, error) {
          wx.hideLoading()
          wx.showToast({
            title: '创建失败, 请重试',
            icon: 'none'
          })
        }
      });
      // 回前一页
    },
    function (error) {
      console.log(error);
    }); 
}