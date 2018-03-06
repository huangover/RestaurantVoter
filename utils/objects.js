var Helper = require('/helper.js');

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

function Session(objectId, deadlineString, title, voteIDs, openIDs, creatorOpenID, expired) {
  var _this = this;
  _this.objectId = null;
  _this.deadlineString = null;
  _this.title = null;
  _this.voteIDs = null;
  _this.deadlineStringToDisplay = null;
  _this.openIDs = null;
  _this.creatorOpenID = null;
  _this.expired = null;

  var init = function () {
    _this.objectId = objectId;
    _this.deadlineString = deadlineString;
    _this.title = title;
    _this.voteIDs = voteIDs;
    _this.openIDs = openIDs;
    _this.creatorOpenID = creatorOpenID;
    _this.expired = expired;

    if (Helper.isSessionExpired(deadlineString)) {
      _this.deadlineStringToDisplay = "已截止"
    } else {
      var deadline = new Date(deadlineString)
      _this.deadlineStringToDisplay = deadline.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }

  init();
}

module.exports = {
  Session: Session,
  Vote: Vote
};