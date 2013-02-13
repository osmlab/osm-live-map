var request = require('request'),
    zlib = require('zlib'),
    sax = require('sax'),
    express = require('express'),
    _ = require('lodash'),
    pad = require('pad');

var planetBase = 'http://planet.openstreetmap.org/';
var changeBase = planetBase + 'replication/minute/';
var stateUrl = changeBase + 'state.txt';
var saxStream = sax.createStream(true);

var changes = {};
var change_id = 0;

saxStream.on("error", function(e) {
    console.error("error!", e);
    this._parser.error = null;
    this._parser.resume();
});

// quantize to one decimal place
function q(x) { return Math.round(x * 100) / 100; }

saxStream.on("opentag", function(node) {
    if (node.name === 'node') {
        changes[
            q(+node.attributes.lon) + ',' +
            q(+node.attributes.lat)] = node.attributes.user;
    }
});

saxStream.on("end", function(node) {
    change_id++;
});

function getSequence(body) {
    var match = body.match(/sequenceNumber\=(\d+)/);
    if (match) return pad(9, match[1], '0');
}

function getSeqUrl(seq) {
    return changeBase + seq.slice(0, 3) +
        '/' + seq.slice(3, 6) + '/' + seq.slice(6, 9) + '.osc.gz';
}

function pullState() {
    request(stateUrl, function(err, res) {
        if (err) return;
        var seq = getSequence(res.body);
        if (!seq) return;
        console.log('requesting change');
        request(getSeqUrl(seq))
            .pipe(zlib.createGunzip())
            .pipe(saxStream);
    });
}

setInterval(pullState, 60 * 1000);
pullState();

var app = express();

app.get('/changes', function(req, res) {
    res.send({
        id: change_id,
        changes: _(changes).pairs().sortBy(function(c) {
            return c.value;
        }).value().map(function(c) {
            return {
                pt: c[0].split(',').map(function(x) { return parseFloat(x); }),
                user: c[1]
            };
        })
    });
});

app.use(express['static'](__dirname + '/public'));

app.listen(3000);
