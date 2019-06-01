function mt_load (buf) {
    var mod = Object.create(Mod.prototype);
    var file = new Uint8Array(buf);
    function read8 () { return file[pos++]; }
    function readstring (size) {
	var ptr=getptr(size);
	var arr = [];
	for (var i=0; i<size; i++)
	    arr[i]=file[ptr+i];
	/* latin-1 */
	return String.fromCharCode.apply(this,arr).replace(/\0.*$/g,'');
    }
    function getptr (size) { return (pos += size) - size; }
    var pos = 0;
    
    var header = readstring (9); /* "\08MONOTONE" */
    var title = readstring (41);
    var author = readstring (41);

    var mt = {
	ver: read8(),
	npatt: read8(),
	nchan: read8(),
	cellsize: read8(),
    };
    var seq = getptr(256);
//    console.log("seq="+seq);
    for (var i=0; i<256 && file[seq+i]!=0xff; i++) /* nothing */;
    var sequence = new Uint8Array (buf, seq, i);
    mod.seqlen = i;
    mod.title = title;
    mod.chan = [];
    mod.nchan = mt.nchan;
    mod.pan = [];
    mod.initspeed = 4;
    mod.inittempo = 150;
    mod.restartpos = 0;
    mod.ntsc = 1;
    mod.sample = [];
    mod.npatts = mt.npatt;

    for (var i=0; i<mod.nchan; i++)
	mod.pan[i] = 0;

    var patt = pos;

    var slen = 1024;
    for (var i=1; i<=1; i++) {
	var s = mod.sample[i] = {
	    name:'sq',
	    len:slen,
	    speed:440*Math.sqrt(Math.sqrt(2))*slen/2,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:slen,
	    looptype:1,
	    data:new Float32Array(slen)
	};
        for (var j=0; j<s.len; j++) {
	    s.data[j] = (j*2 > slen) ? .5 : -.5;
	}
    }

    mod.nsamples = 1;
    mod.sequence = sequence;

    function relpitch(p1, p2) {
	return (Math.log(p2/p1) / Math.LN2)*12;
    }
    function note2period(note) {
	return 27.5*Math.exp2((note-8)/12);
    }
    
    function init(pl) {
	pl.speed = mod.initspeed; pl.tempo = mod.inittempo;
	for (var i=0; i<mod.nchan; i++) {
	    var c={ period:0,
		    vol_env:[], pitch_env:[],
		    slide_target:0,
		    vibpos:0, vibspeed:0, vibdepth:0,
		  };
	    pl.chan[i] = c;
	}
    }

    function do_tick(mod, pl, chan, event, tick, log_fix, flush_env) {    
	var ch = pl.chan[chan];
	if (!tick) {
            ch.ptr = ((sequence[pl.pos] * 64 + pl.event) * mod.nchan + chan)*2;
	}

	var ev = file[patt+ch.ptr]+file[patt+ch.ptr+1]*256;
	var note = ev>>9, eff = (ev>>6)&7, value = ev & 63;
	ch.vibrato = 0;
	var newev={};
	ch.venv = []; ch.penv = [];
	if (!tick) {
	    if (note == 127) {
		ch.venv.vol = 0;
		ch.samp = 0;
	    } else if (note) {
		if (eff == 3)
		    ch.slide_target = note2period(note+8);
		else {
		    ch.slide_target = 0;
		    ch.note = newev.note = note+8;
		    ch.vibpos = 0;
		    ch.period = ch.event_period = note2period(note+8);
		    ch.venv.vol = 1;
		    if (!ch.samp)
			newev.samp = 1;
		    ch.samp = 1;
		}
	    }
	    switch (eff) {
	    case 7:
		pl.speed = value;
		break;
	    case 5:
		pl.nextpos = value;
		if (pl.nextpos > mod.seqlen)
		    log_fix ("jump_overflow");
		effect = value = 0;
		break;
	    case 6:
		pl.nextevent = value;
		if (pl.nextpos == null)
		    pl.nextpos = pl.pos+1;
		break;
	    case 4:
		var spd = value>>3, dep = value &7;
		if (spd)
		    ch.vibspeed = spd;
		if (dep)
		    ch.vibdepth = dep;
		break;
	    }
	} else {
	    switch (eff) {
	    case 0:
		switch (tick %3) {
		case 0: n=0; break;
		case 1: n=value>>3; break;
		case 2: n=value & 7; break;
		}
		ch.penv.arp = n;
		break;
	    case 1:
		if (ch.period < 65535-31)
		    ch.period += value;
		break;
	    case 2:
		if (ch.period > 31)
		    ch.period -= value;
		break;
	    case 3:
		if (ch.slide_target) {
		    while (value--) {
			var diff = ch.slide_target - ch.period;
			var slew = (Math.abs(diff) > 1) ? 1 : Math.abs(diff);
			var sign = (diff > 0) ? 1 : (diff < 0) ? -1 : 0;
			if (!sign) break;
			ch.period += sign * slew;
		    }
		} else {
		    log_fix("porta with no target");
		}
		break;
	    }
	}
        if (ch.period && ch.period != ch.event_period)
            ch.penv.p = relpitch(ch.event_period, ch.period);

	if (eff == 4) {
	    ch.vibpos += ch.vibspeed;
	    //log("vibpos="+ch.vibpos);
	}
	ch.penv.vib = Math.sin(6.28*ch.vibpos/32) * ch.vibdepth / 8;

	
	ch.venv.vol = !!ch.samp;

	return newev;
    }

    preprocess (mod, { do_tick: do_tick,
		       init: init,
		       relpitch: relpitch,
		       getpattlen: function (pl) {
			   return 64;
		       }
		     });
    
    return mod;
}
