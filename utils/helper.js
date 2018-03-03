var now
function isSessionExpired(sessionMiliSec) {
  if (!now) {
    now = new Date();
  }
  var nowMilSeconds = now.getTime()
  return sessionMiliSec < now.getTime()
}

module.exports = {
  isSessionExpired: isSessionExpired
};