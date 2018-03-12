
function isSessionExpired(deadlineString) {
  var deadline = new Date(deadlineString)
  var now = new Date()
  var nowUTC = Date.UTC(
    now.getFullYear(), 
    now.getMonth(), 
    now.getDate(), 
    now.getHours(), 
    now.getMinutes())
  return deadline.getTime() < nowUTC 
}

function createUTCDate(dateString, timeString) {
  var dateParts = dateString.split("-");
  var timeParts = timeString.split(":");

  return new Date(dateParts[0], dateParts[1]-1, dateParts[2], timeParts[0], timeParts[1])
}

module.exports = {
  isSessionExpired: isSessionExpired,
  createUTCDate: createUTCDate
};