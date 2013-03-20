(function() {
    var autoscale = require('autoscale-canvas'),
        ration = require('ration'),
        osmStream = require('osm-stream');

    var c = document.getElementById('c'),
        overlay = document.getElementById('overlay'),
        edits = document.getElementById('edits');
        namesdiv = document.getElementById('names');
    var edits_recorded = 0;
    var w, h;

    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function setSize() {
        w = window.innerWidth;
        h = w / 2;
        c.width = w;
        c.height = h;
        c = autoscale(c);
        ctx = c.getContext('2d');
    }

    setSize();

    var id = '',
        texts = [],
        texti = 0;

    for (var i = 0; i < 5; i++) {
        texts.push(overlay.appendChild(document.createElement('span')));
        texts[i].appendChild(document.createElement('a'));
        texts[i].childNodes[0].className = 'edit-link';
        texts[i].appendChild(document.createElement('a'));
    }

    function setText(x, id, px) {
        texts[texti].style.webkitTransform = 'translate(' + px[0] + 'px,' + px[1] + 'px)';
        texts[texti].childNodes[0].innerHTML = '+';
        texts[texti].childNodes[0].href = 'http://openstreetmap.org/browse/changeset/' + id;
        texts[texti].childNodes[1].innerHTML = x;
        texts[texti].childNodes[1].href = 'http://openstreetmap.org/user/' + x;
        texti = (++texti > 4) ? 0 : texti;
    }

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#fff';

    function scalex(x) {
        return ~~((x + 180) * (w / 360));
    }
    function scaley(y) {
        return ~~(h - ((y + 90) * (h / 180)));
    }

    function setEdits(e) {
        edits.innerHTML = numberWithCommas(edits_recorded);
    }

    function drawCircle(ctx, x, y, r) {
        ctx.fillStyle = '#FFFFB6';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    function drawPoint(point) {
        if (Math.random() > 0.95) {
            ctx.globalAlpha = 0.01;
            drawCircle(ctx,
                scalex(point[0]),
                scaley(point[1]), 6);
        }
        ctx.fillStyle = '#CCE9FF';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(
            scalex(point[0]),
            scaley(point[1]), 2, 2);
        // setText(points[i].user, points[i].id, tl);
        edits_recorded++;
    }

    function drawRect(bbox) {
        ctx.fillStyle = '#CCE9FF';
        ctx.fillRect(
            scalex(bbox[0]),
            scaley(bbox[1]),
            scalex(bbox[2] - bbox[0]),
            scaley(bbox[3] - bbox[1]));
        // setText(points[i].user, points[i].id, tl);
        edits_recorded++;
    }

    var names = [];

    function drawUI() {
        setNames(names);
        setEdits(edits_recorded);
        setTimeout(drawUI, 50);
    }

    drawUI();

    function setNames(names) {
        namesdiv.innerHTML = names.join(', ');
        var lim = 50;
        while (names.length > lim) names.shift();
    }

    osmStream.runFn(function(err, points) {
        ration(points, 60 * 1000, function(d) {
            if (names.indexOf(d.neu.user) == -1) {
                names.push(d.neu.user);
            }
            if (d.neu.lat) drawPoint([d.neu.lon, d.neu.lat]);
            else if (d.neu.bbox) drawRect(p.neu.bbox);
        });
    });

    var reachback = 10;
    var controller = osmStream.runFn(function(err, points) {
        if (reachback-- === 0) controller.cancel();
        if (reachback === 3) return;
        ration(points, 60 * 1000, function(d) {
            if (names.indexOf(d.neu.user) == -1) {
                names.push(d.neu.user);
            }
            if (d.neu.lat) drawPoint([d.neu.lon, d.neu.lat]);
            else if (d.neu.bbox) drawRect(p.neu.bbox);
        });
    }, 100, -1);
})();
