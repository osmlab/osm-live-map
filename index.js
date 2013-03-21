(function() {
    var autoscale = require('autoscale-canvas'),
        ration = require('ration'),
        format = require('format-number')(),
        colorizeAlpha = require('canvas-colorize-alpha'),
        osmStream = require('osm-stream');

    var c = document.getElementById('c'),
        overlay = document.getElementById('overlay'),
        edits = document.getElementById('edits');
        namesdiv = document.getElementById('names'),
        id = '',
        texts = [],
        texti = 0,
        seenT = {},
        names = [],
        edits_recorded = 0;

    for (var i = 0; i < 5; i++) {
        texts.push(overlay.appendChild(document.createElement('span')));
        texts[i].appendChild(document.createElement('a'));
        texts[i].childNodes[0].className = 'edit-link';
        texts[i].appendChild(document.createElement('a'));
    }

    var w = window.innerWidth,
        h = w / 2;

    c.width = w;
    c.height = h;
    c = autoscale(c);

    ctx = c.getContext('2d');
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#fff';

    drawUI();

    var ptsize = 1;

    function drawPoint(d) {
        if (names.indexOf(d.neu.user) == -1) names.push(d.neu.user);
        if (d.neu.lat) {
            ctx.fillRect(scalex(d.neu.lon), scaley(d.neu.lat), ptsize, ptsize);
            setText(d.neu.user, scalex(d.neu.lon), scaley(d.neu.lat));
            edits_recorded++;
            if (edits_recorded % 600 === 0) {
                doBlur(c, ctx);
            }
            if (edits_recorded % 1000 === 0) {
                doColorize(c);
            }
        }
    }

    osmStream.runFn(function(err, points) {
        ration(points, 60 * 1000, drawPoint);
    });

    var reachback = 10;
    var controller = osmStream.runFn(function(err, points) {
        if (reachback-- === 0) controller.cancel();
        if (reachback === 3) return;
        ration(points, 60 * 1000, drawPoint);
    }, 100, -1);

    function setText(t, x, y) {
        if (edits_recorded % 100 || seenT[t]) return;
        texts[texti].style.webkitTransform = 'translate(' + x + 'px,' + y + 'px)';
        texts[texti].childNodes[0].innerHTML = '+';
        texts[texti].childNodes[0].href = 'http://openstreetmap.org/browse/changeset/' + id;
        texts[texti].childNodes[1].innerHTML = t;
        texts[texti].childNodes[1].href = 'http://openstreetmap.org/user/' + t;
        texti = (++texti > 4) ? 0 : texti;
        seenT[t] = true;
    }

    function scalex(x) { return ~~((x + 180) * (w / 360)); }
    function scaley(y) { return ~~(h - ((y + 90) * (h / 180))); }
    function setEdits(e) { edits.innerHTML = format(edits_recorded); }

    function setNames(names) {
        namesdiv.innerHTML = names.join(', ');
        var lim = 50;
        while (names.length > lim) names.shift();
    }

    function drawUI() {
        setNames(names);
        setEdits(edits_recorded);
        setTimeout(drawUI, 100);
    }

    function doBlur(c, ctx) {
        var im = new Image();
        im.src = c.toDataURL();
        ctx.globalAlpha = 0.1;
        ctx.drawImage(im,  0,  1, w, h);
        ctx.drawImage(im,  0,  -1, w, h);
        ctx.drawImage(im,  1,  0, w, h);
        ctx.drawImage(im,  -1,  0, w, h);
        /*
        ctx.drawImage(im,  1,  1, w, h);
        ctx.drawImage(im, -1,  1, w, h);
        ctx.drawImage(im,  1, -1, w, h);
        ctx.drawImage(im, -1, -1, w, h);
        */
        ctx.globalAlpha = 0.8;
    }

    function doColorize(c) {
        colorizeAlpha(c, [[0, 255, 255], [255, 0, 255], [255, 255, 255]]);
    }
})();
