(function() {
    'use strict';

    var autoscale = require('autoscale-canvas'),
        ration = require('ration'),
        format = require('format-number')(),
        colorizeAlpha = require('canvas-colorize-alpha'),
        osmStream = require('osm-stream');

    var c = document.getElementById('c'),
        overlay = document.getElementById('overlay'),
        edits = document.getElementById('edits'),
        namesdiv = document.getElementById('names'),
        texts = [],
        texti = 0,
        seenT = {},
        names = [],
        edits_recorded = 0,
        edits_drawn = 0,
        w = window.innerWidth,
        ptsize = 1,
        h = w / 2,
        grid = {};

    for (var i = 0; i < 5; i++) {
        texts.push(overlay.appendChild(document.createElement('span')));
        texts[i].appendChild(document.createElement('a'));
    }

    c.width = w;
    c.height = h;
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    c = autoscale(c);

    var ctx = c.getContext('2d');
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';

    drawUI();

    osmStream.runFn(function(err, points) {
        ration(points, 60 * 1000, drawPoint);
    });

    var reachback = 10;
    var controller = osmStream.runFn(function(err, points) {
        if (reachback-- === 0) controller.cancel();
        if (reachback === 3) return;
        ration(points, 60 * 1000, drawPoint);
    }, 100, -1);

    function flare(x, y, n) {
        var ang = Math.random() * 2 * Math.PI,
            len = 2 + (Math.random() * 8);

        if (n) len += n / 2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            ~~((Math.cos(ang) * len) + x),
            ~~((Math.sin(ang) * len) + y));
        ctx.globalAlpha = 0.1;
        ctx.stroke();
        ctx.globalAlpha = 0.8;
    }

    function drawPoint(d) {
        if (names.indexOf(d.neu.user) == -1) names.unshift(d.neu.user);
        var quant = scalex(d.neu.lon) + ',' + scaley(d.neu.lat);
        setText(d.neu.user, scalex(d.neu.lon), scaley(d.neu.lat));
        if (d.neu.lat && !grid[quant] || grid[quant] < 15) {
            ctx.fillRect(scalex(d.neu.lon), scaley(d.neu.lat), ptsize, ptsize);
            flare(scalex(d.neu.lon), scaley(d.neu.lat), grid[quant]);
            if (edits_drawn % 100 === 0) doColorize(c);
            ctx = c.getContext('2d');
            if (!grid[quant]) grid[quant] = 0;
            grid[quant]++;
            edits_drawn++;
        }
        edits_recorded++;
    }

    function setText(t, x, y) {
        if (edits_recorded % 10 || seenT[t]) return;
        texts[texti].style.webkitTransform = 'translate(' + x + 'px,' + y + 'px)';
        texts[texti].childNodes[0].innerHTML = t;
        texts[texti].childNodes[0].href = 'http://openstreetmap.org/user/' + t;
        texti = (++texti > 4) ? 0 : texti;
        seenT[t] = true;
    }

    function scalex(x) { return ~~((x + 180) * (w / 360)); }
    function scaley(y) { return ~~(h - ((y + 90) * (h / 180))); }
    function setEdits(e) { edits.innerHTML = format(edits_recorded); }

    function setNames(names) {
        namesdiv.innerHTML = names.join(', ');
        var lim = 50;
        while (names.length > lim) names.pop();
    }

    function drawUI() {
        setNames(names);
        setEdits(edits_recorded);
        setTimeout(drawUI, 100);
    }

    function doColorize(c) {
        colorizeAlpha(c, [[0, 255, 255], [255, 0, 255], [255, 255, 255]]);
    }
})();
