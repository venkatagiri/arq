function pad(num) {
  norm = Math.abs(Math.floor(num));
  return (norm < 10 ? '0' : '') + norm;
}

module.exports = {
  parseDate: function(date, time, timezoneOffset) {
    var tzo = -parseInt(timezoneOffset, 10),
      sign = tzo >= 0 ? '+' : '-';

    return new Date(Date.parse(date+'T'+time+sign+pad(tzo/60)+':'+pad(tzo%60)));
  },
  getFirstMember: function(input) {
    for(var i in input) return input[i];
  }
};
