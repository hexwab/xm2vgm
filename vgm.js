function vgm_load (buf, params) {
    var mod = Object.create(Mod.prototype);
    var file = new Uint8Array(buf);
    var pos = 0;
    function read8 () { return file[pos++]; }
    function read16 () { var i=file[pos] + (file[pos+1]<<8); pos +=2; return i; }
    function read32 () { var i=file[pos] + (file[pos+1]<<8) + (file[pos+2]<<16) + (file[pos+3]<<24); pos +=4; return i; }
    function readstring (ptr, size) {
	var arr = [];
	for (var i=0; i<size; i++)
	    arr[i]=file[ptr+i];
	/* latin-1 */
	return String.fromCharCode.apply(this,arr).replace(/\0.*$/g,'');
    }
    function iparam(key, def) {
	if (params[key]) {
	    var v = parseInt(params[key],10);
	    if (v !== undefined)
		return v;
	}
	return def;
    }

    var vols = [ 4096, 3254, 2584, 2053, 1631, 1295, 1029, 817, 649, 516, 410, 325, 258, 205, 163, 0 ];

    var MUL = iparam('mul',1);
    var sequence = [];
    mod.title = "";
    mod.chan = [];
    mod.pan = [];
    mod.initspeed = 1;
    mod.sample = [];
    mod.npatts = 1;

    var vgm = {
	magic: read32(),
	eofoff: read32(),
	ver: read32(),
	psgclock: read32(),
	ym2413clock: read32(),
	gd3off: read32(),
	nsamples: read32(),
	loopoff: read32(),
	loopsamples: read32(),
	rate: read32(),
	psgfeedback: read16(),
	psgwidth: read8(),
	psgflags: read8(),
	ym2612clock: read32(),
	ym2151clock: read32(),
	dataoff: read32(),
    };

    if (vgm.ver < 0x150) {
	vgm.dataoff = 0xc;
	vgm.psgwidth = 16;
	vgm.psgfeedback = 9;
    }
    vgm.dataoff += 0x34;

    if (vgm.loopoff)
	vgm.loopoff += 0x1c;

    log("psgclock "+vgm.psgclock+" ymclock "+vgm.ym2612clock+" nsamples="+vgm.nsamples+" rate="+vgm.rate);

    mod.nchan = vgm.ym2612clock ? 10 : 4;
    for (var i=0; i<mod.nchan; i++)
	mod.pan[i] = 0;

    var slen = iparam('slen',256);
    var rate = 261.62556 * slen;

    for (var i=1; i<=1; i++) {
	var s = mod.sample[i] = {
	    name:'sq',
	    len:slen,
	    speed:rate,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:slen,
	    looptype:1,
	    data:new Float32Array(slen)
	};
        for (var j=0; j<s.len; j++) {
	    s.data[j] = (j*2 > slen) ? 1 : 0;
	}
    }

    function clock_lfsr(i, fb, width) {
	fb &= i;
        fb ^= fb >> 8;
        fb ^= fb >> 4;
        fb ^= fb >> 2;
        fb ^= fb >> 1;
        fb &= 1;
	return (i>>1) | (fb << (width-1));
    }
	
    var j=0, lfsr=0x8000;
    do {
	j++;
	lfsr = clock_lfsr(lfsr, vgm.psgfeedback, vgm.psgwidth);
    } while (lfsr != 0x8000 && j<100000);
    var len = j*8;

    var s = mod.sample[2] = {
	    name:'white',
	    len:len,
	    speed:261.62556*256/4,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:len,
	looptype:1,
	    data:new Float32Array(len)
    };

    for (var j=0, lfsr = 0x8000; j<s.len; j++) {
	if (!(j & 7))
            lfsr = clock_lfsr(lfsr, vgm.psgfeedback, vgm.psgwidth);

	s.data[j] = (lfsr&1);
    }
    var len = vgm.psgwidth * 16;
    var s = mod.sample[3] = {
	    name:'periodic',
	    len:len,
	    speed:261.62556*64/4,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:len,
	looptype:1,
	    data:new Float32Array(len)
    };

    for (var j=0; j<s.len; j++) {
	s.data[j] = j >= (len / vgm.psgwidth);
    }

    var s = mod.sample[4] = {
	    name:'test',
	    len:slen,
	    speed:rate/2,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:slen,
	    looptype:1,
	    data:new Float32Array(slen)
	};
    for (var j=0; j<s.len; j++) {
	s.data[j] = j/slen;
    }
    
    mod.nsamples = 4;
    mod.inittempo = vgm.rate?vgm.rate*2.5:125;
    mod.seqlen = Math.ceil(vgm.nsamples * mod.inittempo / 44100 / 2.5 / 32 / 6);
    mod.partial = (vgm.nsamples * mod.inittempo / 44100 / 2.5) % 192;
    log("partial="+mod.partial);
    if (vgm.rate) {
	TICKLEN = 44100 / vgm.rate;
    } else {
	/* ? */
	TICKLEN = 882;
    }
    mod.parr = [];
    for (var i=0; i<mod.seqlen; i++)
	sequence[i] = i;
    mod.sequence = sequence;
    mod.restartpos = iparam("restartpos");
    var databank = [];

    var psg = {
	lfsr: 0x8000,
	latch: 0,
	reg: new Uint16Array(8),
	write: function(val) {
	    var psg = this;
	    if (val & 0x80) {
		psg.latch = (val>>4)&7;
		psg.reg[psg.latch] &= 0x3f0;
		psg.reg[psg.latch] |= val & 15;
	    } else {
		//hack
		if (val & 0x40 && psg.extendedrange) {
		    psg.reg[psg.latch] &= 0xf;
		    psg.reg[psg.latch] |= (val & 0x3f) << 4;
		    psg.reg[psg.latch] <<= 2;
		} else {
		    psg.reg[psg.latch] &= 0xf;
		    psg.reg[psg.latch] |= (val & 0x3f) << 4;
		}
	    }
	},
	extendedrange: iparam("extrange")
    };

    var ym = {
	reg1: new Uint8Array(256),
	reg2: new Uint8Array(256)
    };

    function init(pl) {
	pl.speed = mod.initspeed; pl.tempo = mod.inittempo;
	pl.pattdelay = 0;
	for (var i=0; i<mod.nchan; i++) {
	    var c={ period:0, sample:0, soffset:0,
		    pan:mod.pan[i], finetune:0,
		    vol_env:[], pitch_env:[], vol: 0,
		    lastsamp:0,
		    arp:0,
		    env:{},
		    gate:false,
		    timer:0,
		    sweep:0,
		    shadow_period:0,
		    env:0,
		    enabled:false,
		  };
	    pl.chan[i] = c;
	}
	pl.timer = [];
	pl.lastevent = null;
	pl.frame = 0;
	pl.cycle = 0;
	pl.pcmoff = 0;
	pos = vgm.dataoff;
    }

    function relpitch(p1, p2) {
	if (!p2) p2=p1;
	//log ("relpitch: "+p1+" "+p2);
	return (Math.log(p1/p2) / Math.LN2) * 12;
	//return pitch2note(p2)-pitch2note(p1);
    }
    
    function pitch2note (pitch) {
	var a=((Math.log(vgm.psgclock/pitch) / Math.LN2-9) * 12);
	//log("pitch="+pitch+" returning "+a);
	return a;
    }

    var dacoff = {};

    function vgmop(pl, pass) {
	if (pos > file.length)
	    return true;

	if (pass && dacoff[pl.cycle])
	    pl.dacgate = dacoff[pl.cycle];

	function dacwrite(samp) {
	    if (!isFinite(samp)) {
		log("pcmoff="+pl.pcmoff);
		return;
	    }

	    if (!pass) {
		//	    log("samp="+samp);
		if (!pl.dac) {
		    pl.dacstart = pl.cycle;
		    pl.dac = true;
		    pl.dacsamples = 0;
		    pl.lastdac = pl.cycle;
		    pl.dacsample = [];
		}
		if (pl.cycle - pl.lastdac >= 441) { /* 10ms */
		    //dacdone();
		}
		pl.dacsample.push((samp-128)/128);
		pl.lastdac = pl.cycle;
	    }
	}

	function dacdone() {
	    if (pass)
		return;
	    if (!pl.dacsample)
		return;
	    var size = pl.dacsample.length;
	    //log("dacsize ="+size);
	    if (size && (pl.dacstart!=pl.lastdac)) {
	    var rate = 44100 * size / (pl.lastdac - pl.dacstart);
	    //log("rate="+rate+" lastdac="+pl.lastdac+" start="+pl.dacstart+" samples="+size);
            var sample, note;
	    if (samphash[pl.dacsample]) {
		sample = samphash[pl.dacsample];
		//log("got sample");
		note = 48+(Math.log(rate / mod.sample[sample].speed)/Math.LN2)*12;
		//log("got note="+note);
	    } else {
		sample = ++mod.nsamples;
		var s = mod.sample[sample] = {
	    	    name:'auto:'+sample,
	    	    len:size,
	    	    speed:rate,
	    	    vol:64, /* unused */
	    	    rstart:0,
	    	    rlen:0,
	    	    looptype:0,
	    	    data:new Float32Array(size)
		};
		for (var j=0; j<size; j++) {
		    s.data[j] = pl.dacsample[j];
		    if (!isFinite(s.data[j]))
			log("j="+j+ "size="+size);
		}
		samphash[pl.dacsample] = sample;
		note = 48;
	    }

	    dacoff[pl.dacstart] = {s:sample, n:note};
	    }
	    pl.dac = false;
	    pl.dacsample = [];
	}

	var op = read8();
	switch (op) {
	case 0x4f:
	    read8();
	    break;
	case 0x50:
	    var val = read8();
	    psg.write(val);
	    if (!pass)
		pl.evoff[pl.cycle]++;
//	    log("write "+val+" cycle "+pl.cycle);
	    break;
	case 0x52:
	case 0x53:
	    var reg = read8();
	    var val = read8();
	    var port = op-0x52;
	    ym[['reg1','reg2'][port]][reg] = val;
	    break;
	case 0x61:
	    pl.cycle += read16(); break;
	case 0x62:
	    pl.cycle += 735; break;
	case 0x63:
	    pl.cycle += 882; break;
	case 0x66:
	    return true;
	    break;
	case 0x67:
		var skip = read8();
		var type = read8();
		var size = read32();
//		log("size="+size);
	    if (!pass) {
		for (var j=0; j<size; j++) {
                    if (!databank[type])
			databank[type] = [];
                    databank[type].push(file[pos+j]);
		}
	    }
	    pos += size;
	    break;
	case 0x70: case 0x71: case 0x72: case 0x73:
	case 0x74: case 0x75: case 0x76: case 0x77:
	case 0x78: case 0x79: case 0x7a: case 0x7b:
	case 0x7c: case 0x7d: case 0x7e: case 0x7f:
	    pl.cycle += op - 0x6f;
	    break;
	case 0x80: case 0x81: case 0x82: case 0x83:
	case 0x84: case 0x85: case 0x86: case 0x87:
	case 0x88: case 0x89: case 0x8a: case 0x8b:
	case 0x8c: case 0x8d: case 0x8e: case 0x8f:
	    dacwrite(databank[0][pl.pcmoff++]);
	    pl.cycle += op - 0x80;
	    break;
	case 0xe0:
	    pl.pcmoff = read32();
	    dacdone();
	    break;
	default:
	    log("unkop "+op+" pos="+pos);
	    break;
	}

	return false;
    }

    function do_tick(mod, pl, chan, event, tick, log_fix, flush_env) {
	var ch = pl.chan[chan];

	/* event is assumed to increase monotonically */
	if (pl.lastevent != event) {
	    pl.lastevent = event;
	    /* read a new frame */
	    pl.frame++;
	    while (pl.cycle < pl.frame*TICKLEN && !pl.done) {
		pl.done = vgmop(pl, 1);
	    } 

	    //pl.cycle -= TICKLEN;
	}

	var newev={};
	ch.penv = []; ch.venv = [];

	var oldperiod = ch.period;
	var sample;
	switch (chan) {
	case 0:
	case 1:
	case 2:
	    sample = 1;
	    ch.period = psg.reg[chan*2] || 1;
	    //if (ch.period < 10)
		//ch.period = 0;
	    ch.vol = (vols[psg.reg[chan*2 + 1]&15]) / 4096;
	    break;
	case 3:
	    sample = (psg.reg[6]&4) ? 2 : 3;
	    ch.period = [64, 128, 256, psg.reg[4]||1][psg.reg[6]&3];
	    //if (ch.period < 10)
		//ch.period = 0;
	    ch.vol = (vols[psg.reg[7]&15]) / 4096;
	    break;
	case 9:
	    if (pl.dacgate) {
		//log("dacgate="+pl.dacgate);
		    //var rate = pl.dacsamples / (pl.cycle - pl.dacstart);
		    //log("dac rate="+rate+" ("+pl.dacsamples+" samples)");
		    newev.note = pl.dacgate.n;//Math.log(rate)/Math.LN2*12+50;
		    newev.samp = pl.dacgate.s;
		    //newev.effect = 9;
		    //newev.value = pl.dacoff / 256;
		    //pl.dacgate = false;
		pl.dacgate = false;
	    }
	    ch.vol = 1;
	    break;
	default:
	    sample = 4;
	    var c = chan - 4;
	    var regbase = (c % 3);
	    var regfile = c < 3 ? ym.reg1 : ym.reg2;
	    var freq = regfile[0xa0+regbase] + (regfile[0xa4+regbase]&7)*256;
	    var oct = (regfile[0xa4+regbase] >> 3) & 7;
	    ch.period = 2200000/(freq << oct);
	    ch.vol = Math.exp(-(regfile[0x4c+regbase]&127)*Math.LN2/12);
	    break;
	}

	if (sample && (ch.sample != sample)) {
	    newev.samp = ch.sample = sample;
	    flush_env ("venv", "vol", ch, mod, pl); /* sigh */
	}
	
	if ((ch.period && !ch.event_period) || 
	    (oldperiod && ch.period && Math.abs(relpitch(oldperiod,ch.period)>0.9))
	    || !ch.vol) {
	    ch.gate = false;
	    if (ch.period && ch.period != ch.event_period) {
	    ch.event_period = ch.period;
	    newev.note = pitch2note(ch.period);
	    flush_env ("venv", "vol", ch, mod, pl); /* sigh */
	    }
	}

//	ch.vol = (15-psg.reg[chan*2 + 1]) / 15;//FIXME
        if (ch.period && ch.period != ch.event_period)
            ch.penv.p = relpitch(ch.event_period, ch.period);

	ch.venv.vol = ch.vol;

	return newev;
    }

    var samphash = {};
    /* pass 1 */
    pos = vgm.dataoff;
    var q = {
	cycle: 0,
	evoff: {},
	pcmoff: 0,
    };
    while (!vgmop(q, 0)) {
	/* nothing */
    }

    console.log(dacoff);

    // for (var maybespeed=100; maybespeed < 800; maybespeed++) {
    // 	var e={};
    // 	var k = Object.keys(q.evoff);
    // 	for (var i in k) {
    // 	    e[k[i] % maybespeed]++;
    // 	}
    // 	log("maybespeed="+maybespeed+" count="+Object.keys(e).length);
    // }

    preprocess (mod, { init: init,
		       do_tick: do_tick,
		       relpitch: relpitch,
		       getpattlen: function(pl) {
			   return (mod.partial && pl.pos==mod.seqlen-1) ? mod.partial*MUL : 32*6*MUL
		       }
		     });

    return mod;
}
