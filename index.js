var request = require('request'),
    zlib = require('zlib'),
    sax = require('sax'),
    express = require('express'),
    _ = require('lodash'),
    pad = require('pad');

var planetBase = 'http://planet.openstreetmap.org/';
var changeBase = planetBase + 'replication/changesets/';
var stateUrl = changeBase + 'state.yaml';
var saxStream = sax.createStream(true);

var changes = [];
var change_id = 0;

saxStream.on("error", function(e) {
    console.error("error!", e);
    this._parser.error = null;
    this._parser.resume();
});

// quantize to one decimal place
function q(x) { return Math.round(x * 100) / 100; }

saxStream.on("opentag", function(node) {
    if (node.name === 'changeset') {
        if (node.attributes.open && node.attributes.open === 'true') {
            changes.push({
                id: node.attributes.id,
                box: [[
                    q(+node.attributes.min_lon),
                    q(+node.attributes.min_lat)],
                    [q(+node.attributes.max_lon),
                    q(+node.attributes.max_lat)]],
                user: node.attributes.user
            });
        }
    }
});

saxStream.on("end", function(node) {
    change_id++;
});

function getSequence(body) {
    var match = body.match(/sequence\: (\d+)/);
    if (match) return pad(9, match[1], '0');
}

function getSeqUrl(seq) {
    return changeBase + seq.slice(0, 3) +
        '/' + seq.slice(3, 6) + '/' + seq.slice(6, 9) + '.osm.gz';
}

function pullState() {
    request(stateUrl, function(err, res) {
        if (err) return;
        var seq = getSequence(res.body);
        if (!seq) return;
        changes = [];
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
        changes: changes
    });
});

app.use(express['static'](__dirname + '/public'));

app.listen(3000);
