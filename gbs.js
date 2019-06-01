function gbs_load (buf, params) {
    var mod = Object.create(Mod.prototype);
    var file = new Uint8Array(buf);
    var pos = 4;
    function read8 () { return file[pos++]; }
    function read32b () { var i=file[pos+3] + (file[pos+2]<<8) + (file[pos+1]<<16) + (file[pos]<<24); pos +=4; return i; }
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

    var MUL = iparam('mul',1);
    var sequence = [];
    mod.title = dump?"":readstring(16,32);
    mod.chan = [];
    mod.pan = [];
    mod.initspeed = 1;
    mod.nchan = 4;
    mod.sample = [];
    mod.npatts = 1;
    
    var dump = file[0] == 0x67;
    var gbsobj;
    
    for (var i=0; i<mod.nchan; i++)
	mod.pan[i] = 0;

    var slen = iparam('slen',256);
    var rate = 261.62556 * slen;

    var waveforms = [ 0x80, 0x81, 0xe1, 0x7e ];

    for (var i=1; i<=4; i++) {
	var s = mod.sample[i] = {
	    name:'sq:'+i,
	    len:slen,
	    speed:rate,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:slen,
	    looptype:1,
	    data:new Float32Array(slen)
	};
        for (var j=0; j<s.len; j++) {
	    s.data[j] = (waveforms[i-1] >> (j*8/slen)) & 1 ? 1 : 0;
	}
    }

    var s = mod.sample[5] = {
	    name:'noise',
	    len:16384,
	    speed:rate,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:16384,
	looptype:1,
	    data:new Float32Array(16384)
    };
    for (var j=0; j<s.len; j++) {
	s.data[j] = Math.random();
    }

    mod.nsamples = 5;

    mod.ntsc = 1;
    mod.seqlen = 50;

    mod.parr = [];
    for (var i=0; i<mod.seqlen; i++)
	sequence[i] = i;
    mod.sequence = sequence;


    var samphash = [];

    function reg_write(pl, reg, val, tick) {
	var regs = pl.regs;
	reg -= 0xff10;
	//log ("reg_write:"+reg+" "+val+" tick="+tick);
	var ch = (reg/5)|0;
	pl.regs[reg] = val;
	switch (reg) {
	    case 0x4: case 0x9:
	    case 0xe: case 0x13:
	    if (val & 0x80) {
		pl.chan[ch].gate = true;
		pl.chan[ch].enabled = true;
		//log("ch "+ch+" trigger "+(val & 0x80));
	    }
	    //if (reg == 0x13) break;
	    /* fall-through */
	    case 0x3: case 0x8:
	    case 0xd:
	    var pitch = 2048 - ((regs[ch*5+3] + regs[ch*5+4] * 256) & 0x7ff);
	    pl.chan[ch].period = pitch;
	    //if (ch==0)log("ch "+ch+" pitch="+pitch+" tick="+tick);
	    break;
	    case 0x1: case 0x6:
	    case 0x10:
	    pl.chan[ch].timer = (64-(val&63)) * 16384;
	    break;
	    case 0xb:
	    pl.chan[ch].timer = (256-val) * 16384;
	    break;
	    case 0x2: case 0x7:
	    case 0x11:
	    pl.chan[ch].env = (val &7) * 65536;
	    break;
	    case 0:
	    pl.chan[ch].sweep = ((val >> 4) & 7) * 16384;
	    break;
	}
	//if (reg > 0x1f) log ("sampreg: "+reg+" "+val);
    }

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
	if (dump) {
	    pl.lasttick = read32b();
	} else {
	    var subsong = iparam('t',0);
	    if (subsong)
		log("forcing subsong "+subsong);

	    gbsobj = gbsplay.init(file, function(tick,reg,val) {
				      //alert("reg "+reg+" val "+val+" tick "+tick);
				      if (reg >= 0xff10 && reg <= 0xff3f)
					  reg_write(pl, reg, val, tick);
				  }, subsong);
	    if (!gbsobj) alert ("!gbsobj");
	}
	pl.lastevent = null;
	pl.regs = new Uint8Array(48);
	pl.frame = 0;

	mod.inittempo = 149.25074*MUL;
    }

    function relpitch(p1, p2) {
	if (!p2) p2=p1;
	//log ("relpitch: "+p1+" "+p2);
	return (Math.log(p1/p2) / Math.LN2) * 12;
	//return pitch2note(p2)-pitch2note(p1);
    }
    
    function pitch2note (pitch) {
	var a=((Math.log(262144/(pitch)) / Math.LN2-5) * 12);
	//log("pitch="+pitch+" returning "+a);
	return a;
    }

    function do_tick(mod, pl, chan, event, tick, log_fix, flush_env) {
	/* event is assumed to increase monotonically */
	if (pl.lastevent != event) {
	    pl.lastevent = event;
	    /* read a new frame */
	    if (dump) {
		while (pl.lasttick < pl.frame * 70256/MUL) {
		    var reg = read32b();
		    var val = read8();
		    var tick = read32b();
		    pl.lasttick = tick;
		    //log ("tick="+tick); 
		    if (reg >= 0xff10 && reg <= 0xff3f)
			reg_write(pl, reg, val, tick);
		    //else log("spurious reg "+reg+" "+val);
		}
	    } else {
		gbsplay.step(70256/MUL);
	    }
	    //log("frame "+pl.frame+" tick "+tick);
	    //log ("ch0pitch="+pl.chan[0].period);
	    pl.frame++;
	}

	var ch = pl.chan[chan];
	var newev={};
	ch.penv = []; ch.venv = [];

	var regs = pl.regs;
	var base = chan * 5;

	if (chan==0 && (regs[base] & 0x70)) {
	    if (ch.sweep > 0) {
	    ch.sweep -= 70256/MUL;
	    //log("sweep");
	    while (ch.sweep <= 0) {
		ch.sweep += 16384 * ((regs[base] >> 4) & 7);
		//log("sweep period="+ch.period+" base="+regs[base]);
		var inc=((regs[base] & 16)?1:-1)*(ch.period >> (regs[base] &7));
		if (ch.period+inc > 0 && ch.period+inc < 2048)
		    ch.period += inc;

		//log("inc="+inc);
		//log("sweep period2="+ch.period+" base="+regs[base]);
	    }
		}
	}

	var pan = 0;
	switch ((regs[0x15] >> chan) & 0x11) {
	case 0: ch.enabled = false; break; /* silent */
	case 0x10: pan = -127; break;
	case 0x01: pan = 127; break;
	case 0x11: pan = 0; break;
	}
	if (pan != ch.pan) {
	    ch.pan = pan;
	    newev.effect = 8; newev.value = pan+128;
	}

	var sample;
	switch (chan) {
	case 0:
	case 1:
	    sample = (regs[base+1] >>6) + 1;
	    break;
	case 2:
	    var sampstr = '';
	    for (var i=0; i<16; i++)
		sampstr += regs[32+i]+",";
	    if (sample = samphash[sampstr]) {
		/* nothing */
	    } else {
		sample = samphash[sampstr] = ++mod.nsamples;
		var s = mod.sample[sample] = {
		    name:'auto:'+sample,
		    len:slen,
		    speed:rate/2,
		    vol:64, /* unused */
		    rstart:0,
		    rlen:slen,
		    looptype:1,
		    data:new Float32Array(slen)
		};
		var mul = slen / 32;
		for (var j=0; j<16; j++) {
		    for (var k=0; k < mul; k++) {
			s.data[(j*2)*mul+k] = (regs[32+j] >> 4) / 15;
			s.data[(j*2+1)*mul+k] = (regs[32+j] & 15) / 15;
		    }
		}
		//log("new sample "+sample+" hash="+sampstr);
	    }
	    break;
	case 3:
	    sample = 5;
	    break;
	}

	if (sample && (ch.sample != sample || ch.gate)) {
	    newev.samp = ch.sample = sample;
	    flush_env ("venv", "vol", ch, mod, pl); /* sigh */
	}

	if (ch.gate) {
	    ch.gate = false;
	    //	    if (!ch.pattsamp) newev.samp = ch.sample = 64;
//	    ch.pattsamp = true;
//	    flush_env ("venv", mod, pl);
	    if (ch.period != ch.event_period) {
	    ch.event_period = ch.period;
	    //log("base="+base+" 3="+regs[base+3]+" 4="+regs[base+4]);
	    newev.note = pitch2note(ch.period);
//	    log ("ch="+chan+" pitch="+pitch+" note="+newev.note);
	    //flush_env ("penv", mod, pl);
	    }	    
	}

	if (chan == 2)
	    switch ((regs[base+2] >> 5) & 3) {
		case 0: ch.vol = 0; break;
		case 1: ch.vol = 64; break;
		case 2: ch.vol = 32; break;
		case 3: ch.vol = 16; break;
	    }
	else
	    ch.vol = (regs[base+2] >> 4) * 4;
	if (ch.timer > 0 && regs[base+4] & 0x40) {
	    ch.timer -= 70256/MUL;
	    if (ch.timer < 0)
		ch.enabled = false;
	}

	if (ch.env > 0) {
	    ch.env -= 70256/MUL;
	    while (ch.env < 0) {
		var add = regs[base+2] & 8;
		if (add) {
		    regs[base+2] += 0x10;
		    if (regs[base+2] < 0x10) {
			regs[base+2] |= 0xf0;
			break;
		    }
		} else {
		    regs[base+2] -= 0x10;
		    if (regs[base+2] >= 0xf0) {
			regs[base+2] &= 0xf;
			break;
		    }
		}
		ch.env += 65536 * (regs[base+2] & 7);
	    }
	}

	if (!ch.enabled)
	    ch.vol = 0;
	if (!sample)
	    ch.vol = 0;

	//if (!wave) ch.vol = 0;
//	if (chan==2)log ("ch="+chan+" env_phase="+ch.env_phase+" vol="+ch.vol);

        if (ch.period && ch.period != ch.event_period)
            ch.penv.p = relpitch(ch.event_period, ch.period);

	//ch.venv.global = (regs[24] & 15) / 15;
	
	ch.venv.vol = ch.vol/64;

	return newev;
    }

    preprocess (mod, { init: init,
		       do_tick: do_tick,
		       relpitch: relpitch,
		       getpattlen: function() { return 32*6*MUL }
		     });

    return mod;
}