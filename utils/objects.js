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

function Session(objectId, deadlineTimeMiliSec, title, voteIDs, openIDs, creatorOpenID, expired) {
  var _this = this;
  _this.objectId = null;
  _this.deadlineTimeMiliSec = null;
  _this.title = null;
  _this.voteIDs = null;
  _this.deadlineString = null;
  _this.openIDs = null;
  _this.creatorOpenID = null;
  _this.expired = null;

  var init = function () {
    _this.objectId = objectId;
    _this.deadlineTimeMiliSec = deadlineTimeMiliSec;
    _this.title = title;
    _this.voteIDs = voteIDs;
    _this.openIDs = openIDs;
    _this.creatorOpenID = creatorOpenID;
    _this.expired = expired;

    // deadline string
    var now = new Date()
    if (deadlineTimeMiliSec < now.getTime()) {
      _this.deadlineString = "已截止"
    } else {
      var date = new Date(deadlineTimeMiliSec);
      var dateString = date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString() + "-" + date.getDate().toString() + " " + date.getHours().toString() + ":" + date.getMinutes().toString();
      _this.deadlineString = dateString;
    }
  }

  init();
}

module.exports = {
  Session: Session,
  Vote: Vote
};