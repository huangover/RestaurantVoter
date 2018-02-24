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

function Session(id, deadlineTimeMiliSec, title, voteIDs) {
  var _this = this;
  _this.id = null;
  _this.deadlineTimeMiliSec = null;
  _this.title = null;
  _this.voteIDs = null;
  _this.deadlineString = null;

  var init = function () {
    _this.id = id;
    _this.deadlineTimeMiliSec = deadlineTimeMiliSec;
    _this.title = title;
    _this.voteIDs = voteIDs;

    // deadline string
    var date = new Date(deadlineTimeMiliSec);
    console.log(date);
    console.log((date.getMonth() + 1).toString());
    var dateString = date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString() + "-" + date.getDate().toString() + " " + date.getHours().toString() + ":" + date.getMinutes().toString();
    _this.deadlineString = dateString;
  }

  init();
}

module.exports = {
  Session: Session,
  Vote: Vote
};