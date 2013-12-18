function pad(num) {
  norm = Math.abs(Math.floor(num));
  return (norm < 10 ? '0' : '') + norm;
}

function convertToClientTimezone(date, timezoneOffset) {
  var clientTZO = parseInt(timezoneOffset, 10),
    serverTZO = parseInt(date.getTimezoneOffset(), 10);

  return new Date(date.getTime() + (serverTZO * 1000 * 60) - (clientTZO * 1000 * 60));
}

function toGMTOffset(timezoneOffset) {
  var tzo = -parseInt(timezoneOffset, 10),
    sign = tzo >= 0 ? '+' : '-';

  return sign+pad(tzo/60)+':'+pad(tzo%60);
}

module.exports = {
  formatTime: function(date, timezoneOffset) {
    var date = convertToClientTimezone(date, timezoneOffset);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + ' GMT' + toGMTOffset(timezoneOffset);
  },
  parseDate: function(date, time, timezoneOffset) {
    return new Date(Date.parse(date+'T'+time+toGMTOffset(timezoneOffset)));
  },
  getFirstMember: function(input) {
    for(var i in input) return input[i];
  }
};
