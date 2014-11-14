function formatDate(d) {
  return d.getDate() + '/' + (d.getMonth() + 1) + '/' + (d.getYear() + 1900);
}

function cap(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

var tools = {
  'Toolbox':            'DEVTOOLS_TOOLBOX_OPENED_PER_USER_FLAG'
};

// function fetchChannels(versions, channel, finish) {
//   _.each(versions, function(version) {
//     // run fetchChannel, collect everything...
//     fetchChannel(version, channel, function (result) {
//       console.log("done", result);
//     })
//   });
// }

function fetchToolboxUsage(finish) {
  var start = 32, // the version we started to collect Beta data
      dd = new DevtoolsTelemetry(Telemetry);

  dd.init(function() {
    var end = _.last(dd.getVersionRange()); // get the latest nightly version
    var windows = generateBuildWindows(start, end);

    // console.log(windows);

    var _channelNames = _.keys(_.last((windows)));
    var channels  = _.map(_channelNames, function(name) {
      return {name: name, versions: _.compact(_.pluck(windows, name))};
    });

    // dd.getWeeklyToolUsage(windows, 'Toolbox', callback);
    // debugger;


    // var _version = _.last(windows).nightly;


    var outer = _.map(channels, function(channel) {
      var functions = _.map(channel.versions, function(version) {
        return function(callback) {
          Telemetry.loadEvolutionOverTime(version, tools.Toolbox, function(histogramEvolution) {
            var results = histogramEvolution.map(function (date, histogram) {
              var _m = moment(date);
              var shortDate = _m.format('YYYY/MM/DD');
              var _count = 0;
              histogram.each((count, start, end, index) => {
                if (start === 1) {
                  _count += count;
                }
              });
              return {channel: channel.name, date: date, count: _count, version: version};
            });
            callback(null, results);
          });
        }
      });

      return {name: channel.name, functions: functions};
    });

    var functions = _.flatten(_.map(outer, function(_item) {
      return _item.functions;
    }));

    // console.table(functions);

    async.parallel(functions, function(err, results) {
      console.log("done parallel");

      // results = graphify(results);

      finish(results);
    })
  });
}

function graphify(results) {
  return _.map(results, function(arr) {
    return _.map(arr, function(result) {

    });
  });
}

$(function() {

  $('#reload-btn').click(function() {
    fetch(render);
  });

  fetch(render);
});

function fetch(callback) {

  $('#about-toggle').click(function(e) {
    e.preventDefault();
    $('#about-container').toggle();
  });

  var chart_struct = {
    datasets: [],
    labels: []
  };

  var r = [], _i = 0;
  var chart_columns = [];

  fetchToolboxUsage(function (results) {
    // console.table(results);
    callback(results);
  });
}

function render(data) {
  var categories = [];
  var series = _.map(data, function(version) {
    var pair = _.pairs(_.groupBy(version, 'version')).pop();
    var _data =_.map(pair[1], function(row) {
      function getDate(d) {
        return Date.UTC( (d.getYear()+1900), d.getMonth(), d.getDate() );
      }
      return [getDate(row.date), row.count];
    });

    pair[1] = _data;
    var grouped =  _.object(['name', 'data'], pair);
    return grouped;
  });

  var graph = {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Toolbox usage, Daily counts'
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            },
            title: {
                text: 'Date'
            }
        },
        yAxis: {
            title: {
                text: 'Unique installs'
            },
            min: 0
        },
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x:%b %e}: {point.y:.2f}'
        },
        series: series,
        plotOptions: {
          series: {
            marker: {
              enabled: false
            }
          }
        }
    };

  $('#graph-container').highcharts(graph);
}
