function xm_load (buf, params) {
    var mod = Object.create(Mod.prototype);
    var file = new Uint8Array(buf);
    function read16l () { var i=file[pos] + file[pos+1]*256; pos +=2; return i; }
    function read32l () { var i=file[pos] + (file[pos+1]<<8) + (file[pos+2]<<16) + (file[pos+3]<<24); pos +=4; return i; }
    function read8 () { return file[pos++]; }
    function readstring (size) {
	var ptr=getptr(size);
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

    function getptr (size) { return (pos += size) - size; }
    var pos = 0;
    
    var id = readstring (17); /* "Extended Module: " */
    var title = readstring (20);
    read8(); /* 0x1a */
    var creator = readstring(20);
    var version = read16l();

    var xm = {
	hlen: read32l(),
	seqlen: read16l(),
	respos: read16l(),
	nchan: read16l(),
	npatt: read16l(),
	nins: read16l(),
	flags: read16l(),
	speed: read16l(),
	tempo: read16l(),
    };
    var sequence = new Uint8Array (buf, pos, xm.seqlen);
    pos += xm.hlen - 20;
    mod.title = title;
    mod.chan = [];
    mod.nchan = xm.nchan;
    mod.pan = [];
    mod.initspeed = xm.speed || 6;
    mod.inittempo = xm.tempo || 125;
    mod.restartpos = xm.respos;

//    mod.init();

    var penv = [];
    var venv = [];
    var volfade = [];
    var vib = [];

//    var patmp = [];
    var parr = [];
    mod.sample = [];
    mod.npatts = xm.npatt;
//    mod.pitchenv = [[]];

    for (var i=0; i<mod.nchan; i++)
	mod.pan[i] = 0;

    for (var i=0; i<xm.npatt; i++) {
	var headlen = read32l(); //log ("pos="+pos+" headlen="+headlen);
	var pack = read8();
	var nrows = read16l();
	if (!nrows) nrows=256;
	var size = read16l();
	var thispos = pos;
	//log ("nrows: "+nrows+" nchan:"+ mod.nchan+" evsize="+ mod.eventsize);
	var p = [];
	var ptr = 0;
	for (var r=0; r < nrows; r++) {
	    for (var ch = 0; ch < mod.nchan; ch++) {
		var note = 0, samp = 0, vol = 0, effect = 0, value = 0;
		var b = read8();
		if (b & 0x80) {
		    if (b & 1) note = read8();
		} else {
		    note = b;
		    b = 30;
		}
		
		if (b & 2) samp = read8();
		if (b & 4) vol = read8();
		if (b & 8) effect = read8();
		if (b & 16) value = read8();
		p.push({
		    note:note, samp:samp, vol:vol,
		    effect:effect, value:value
		});
	    }
	}
	pos = thispos + size;

	parr[i] = p;
    }

    function Envelope() {
	var e = {
	    pos: 0,
	    clock: function (env, sustain) {
		/* adapted from soundtracker */
		var pos = this.pos;
		var e = env.env;
		var len = e[e.length-1].off;

		if (this.pos > len)
		    this.pos = len;

		var i;
		for (i=e.length-1; i >= 1; i--) {
		    if(e[i].off <= this.pos)
			break;
		}

		var v = e[i].val;
		if(this.pos != e[i].off)
		    v += (this.pos-e[i].off) *
		    (e[i+1].val-e[i].val) / ( e[i+1].off-e[i].off);
		//if (v<0) alert("pos="+this.pos+" ioff="+e[i].off+
		//	       " +1off="+e[i+1].off+" val="+e[i].val);

		if(this.pos < len &&
		   !(sustain && (env.type & 2 /* sustain */) && this.pos == e[env.sus].off)) {
		    this.pos++;
		    
		    if(env.type & 4 /* loop */) {
			if(this.pos == e[env.end].off
			   /* this is weird... but it is one of KB's latest fixes which I don't understand. Let's trust him. */
			   && (sustain || !(env.type & 2) || (e[env.end].off != e[env.sus].pos)))
			    this.pos = e[env.start].off;
		    }
		} 
		//log("off="+this.pos+" len="+len);
		//if (!isFinite(v)) alert ("e[i+1].val="+e[i+1].val);
		return v;
	    }
	};

	return Object.create(e);
    }

	function envelope(env, pos, sus) {
	    if (!env || !(env.type & 1))
		return 64;
//	    console.log(env);
	    var i =0;
	    var e = env.env;
	    var l = e.length;

	    while (e[i].off <= pos) {
		if ((env.type & 2) && (i == env.sus) && !sus)
		    return e[i].val;

		if ((env.type & 4) && i == env.end) { /* loop */
		    i = env.start;
		    pos -= e[env.end].off - e[env.start].off;
		} else {
		    if (++i == l)
			break;
		}
		//log("l="+l+" i="+i);
	    }

	    i--;

//	    log("i="+i+" e[i]="+e[i]);
	    if (!e[i+1]) /* end */
		return e[i].val;

	    var d = e[i+1].off - e[i].off;
	    if (d <= 0)
		return e[i].val;
	    d = (pos-e[i].off) / d;
	    return e[i].val * (1-d) + e[i+1].val * d;
	}

    for (var i=1; i<=xm.nins; i++) {
	var thispos = pos;
	var size = read32l();
	var name = readstring(22);
	var type = read8();
	var nsamp = read16l();
	//log ("name "+name+" nsamp "+nsamp);

	if (nsamp) {
	    var hsize = read32l();
	    pos += 96; /* mapping */
	    var voloff = pos;
	    pos += 48; /* volenv */
	    var panoff = pos;
	    pos += 48; /* panenv */
	    var nvol = read8(); /* nvol */
	    var npan = read8(); /* npan */

	    function read_env (len, ptr) {
		var e=[];
		for (var i=0; i<len; i++, ptr+=4) {
		    var off = file[ptr]+file[ptr+1]*256;
		    var val = file[ptr+2]+file[ptr+3]*256;
		    if (i && e[i-1].off > off)
			log("nonmonotonic_env: "+e[i-1].off+">"+off);
		    
		    e.push({ off: off, val: val });
		}
		return e;
	    }

	    var volsuspoint = read8(); /* volsuspoint */
	    var volloopstart = read8(); /* volloopstart */
	    var volloopend = read8(); /* volloopend */
	    var pansuspoint = read8(); /* pansuspoint */
	    var panloopstart = read8(); /* panloopstart */
	    var panloopend = read8(); /* panloopend */
	    var vollooptype = read8(); /* vol looptype */
	    var panlooptype = read8(); /* pan looptype */

	    venv[i] = { type: vollooptype,
			env: read_env(nvol, voloff),
			start: volloopstart,
			end: volloopend,
			sus: volsuspoint
		      };

	    penv[i] = { type: panlooptype,
			env: read_env(npan, panoff),
			start: panloopstart,
			end: panloopend,
			sus: pansuspoint
		      };

	    if (0) {
		var e1= new Envelope(); 
		var e2 = new Envelope(); 
		var s='';
		for (var j=0; j<300; j++) {
		    var e=e1.clock(venv[i],(j<10?1:0));
		    log(e);
		    for (var k=0; k<15; k++) { if (e>=([64,51,40,32,25,20,16,13,10,8,6,5,4,3,2,0][k])) break; }
		    s+=k+",";
/*		    log("env="+i+ "off="+j+" type="+venv[i].type+
			" outnosus="+e1.clock(venv[i],(j<10?1:0))+
			" outsus="+e2.clock(venv[i],1));
*/
		}
		console.log(i+": "+s);
	    }

//	    console.log(venv[i]);
	    //var pan = read_env(npan, panoff);

	    vib[i]={
		type:read8(), /* vibtype */
		sweep:read8(), /* vibsweep */
		depth:read8(), /* vibdepth */
		speed:read8() /* vibrate */
	    };
	    volfade[i] = read16l(); /* volfade */
	    read16l(); /* reserved */
	}
	    //log ("pos = "+pos+" size="+ size+" should be "+(thispos+size));
	    pos = thispos + size;


	var total_len = 0;
	var len2, flags2;
	var sample=[];

	for (var j=0; j<nsamp; j++) {
	    var len = read32l();
		var lstart = read32l();
		var llen = read32l();
		var vol = read8();
		var ft = read8(); if (ft > 127) ft -= 256;
		var flags = read8();
		var pan = read8();
		var relnote = read8();
		if (relnote > 127) relnote -= 256;
		read8(); /* reserved */
		var sname = readstring(22);
		//log ("pos "+pos+"sname "+sname+" len "+len+" flags "+flags);
	    {
		    var s={};
		    s.len = (flags & 16) ? len/2 : len;
		    s.rstart = (flags & 16) ? lstart/2 : lstart;
		    s.rlen = (flags & 16) ? llen/2 : llen;
		    s.vol = vol;
		    s.speed = 8363 * Math.exp2((relnote + ft/128)/12);
		    s.name = name;
		    s.flags = flags;
		s.pan = pan;

		    sample[j] = s;
	    }

	    total_len += len;
	}

	mod.sample[i] = {len:0, rstart:0, rlen:2, vol:0, speed:0, name:name, data:[] };

	for (var j=0; j<nsamp; j++) {
	    var s=sample[j];
	    if (!s.len)
		continue;
	    s.data = new Float32Array (s.len+2);
	    if (s.flags & 16) {
		/* 16 bit */
		var old = 0;
		for (var k=0; k<s.len; k++) {
		    old = ((file[pos+k*2]+file[pos+k*2+1]*256) + old) & 65535;
		    s.data[k] = (old>32767?old-65536:old)/32768;
		}
		pos += s.len*2;
	    } else {
		var old = 0;
		for (var k=0; k<s.len; k++) {
		    old =  ((file[pos+k]+old)&255);
		    s.data[k] = (old>127?old-256:old)/128;
		}
		pos += s.len;
	    }

	    var lt = s.flags & 3;
	    switch (lt) {
	    case 0: case 1: case 2:
		s.looptype = lt;
		break;
	    case 3:
		/* see, e.g. freefall.xm, inst 1 */
		s.looptype = 2;
		break;
		/*default:
		log("unknown looptype "+lt);
		s.looptype = 0;
		break;*/
	    }

	    mod.sample[i] = s;
	}
    }

    mod.ntsc = 1;
    mod.nsamples = xm.nins;
    mod.seqlen = xm.seqlen;
    mod.sequence = sequence;

    var relpitch, note2period;

    log("flags: "+xm.flags);
    if (xm.flags & 1) {
	/* linear */
	 relpitch = function(p1, p2) {
	    return (p1-p2)/16;
	};
	note2period = function(note) {
	    return 7680 - note*16;
	};
    } else {
	/* log */
	relpitch = function(p1, p2) {
	    return (Math.log(p1/p2) / Math.LN2) * 12;
	};
	note2period = function(note) {
	    return 4*1712 / Math.exp2(note/12);
	};
    }


    function init(pl) {
	pl.speed = mod.initspeed; pl.tempo = mod.inittempo;
	pl.pattdelay = 0;
	pl.global_vol = 64;
	for (var i=0; i<mod.nchan; i++) {
	    var c={ period:0, sample:0, soffset:0,
		    pan:mod.pan[i], finetune:0,
		    command_memory:[], slide_target:0,
		    looppos:0, loopcount:0,
		    vibpos:0, vibspeed:0, vibdepth:0,
		    trempos:0, tremspeed:0, tremdepth:0,
		    arppos:0,
		    lastsamp:0, env_off:0,
		    vol: 0, volfade: 0,
		    span:128,
		    vol_env:[], pitch_env:[]
		  };
	    pl.chan[i] = c;
	}
	pl.pos = pl.ipos = iparam('t', 0);
    }

    function do_tick(mod, pl, chan, event, tick, log_fix, flush_env) {    
	
	var ch = pl.chan[chan];
	var ptr, effect, period, samp;
	if (pl.event<0)
	    alert("event<0");
//	log("pos="+pl.pos+" patt="+file[sequence+pl.pos]);
	if (!tick)
            ch.ptr = parr[sequence[pl.pos]][pl.event * mod.nchan + chan];
	if (!ch.ptr) {
	    /* this is kind of a hack */
//	    pl.nextpos = pl.pos+1;
//	    return null;
//	    log("parr.length="+parr[sequence[pl.pos]].length+" off="+(pl.event * mod.nchan + chan)+" ptr="+parr[sequence[pl.pos]][0]);
//	    log("ptr="+pl.ptr);
	}
        var effect = ch.ptr.effect, value = ch.ptr.value;
        var period = ch.ptr.note, vol = ch.ptr.vol;
        var samp = ch.ptr.samp;
	var sm = samp ? mod.sample[samp] : null;
	var old={}; 
	var dovib;
	old.period = ch.period;
	old.samp = ch.samp;
	old.vol = ch.vol;
	old.span = ch.span;
	ch.arp = 0; ch.vibrato = 0;
	var newev={};
	ch.venv = []; ch.penv = [];
	
	var notetick = 0;
	if (effect == 14 && (value >> 4) == 13)
	    notetick = value & 15;
	//if (effect)
//	    log ("eff:"+effect+" val:"+value);
	if (tick==0) {
	    switch (effect) {
	    case 15:
		if (value < 32) {
		    pl.speed=value; effect = value = 0;
		} else {
		    pl.tempo = value;
		    newev.effect = effect; newev.value = value;
		}
		break;
		
	    case 4:
		if (value & 15) ch.vibdepth = value & 15;
		if (value>>4) ch.vibspeed = value>>4;
		if (!ch.vibspeed || !ch.vibdepth) {
		    log_fix("vib_lacking");
		}
		break;
	    case 7:
		if (value & 15) ch.tremdepth = value & 15;
		if (value>>4) ch.tremspeed = value>>4;
		if (!ch.tremspeed || !ch.tremdepth) {
		    log_fix("trem_lacking");
		} else 
		    trem = { depth: ch.tremdepth, speed: ch.tremspeed };
		break;

	    case 14:
		switch (value >> 4) {
		case 14: pl.pattdelay = value & 15; break;
		}
		break;

	    case 16: /* 'g' */
		pl.global_vol = value;
		break;
	    }
	    /*
 	     if (ch.delayedperiod) {
	     if (!period) {
	     period = ch.delayedperiod;
	     ch.pitch_env = null;
	     }
	     ch.delayedperiod = 0;
	     }
	     if (ch.delayedsamp) {
	     if (!samp)
	     samp = ch.delayedsamp;
	     ch.delayedsamp = 0;
	     }
	     */
	}

	/* memory */
	switch (effect) {
	    case 1: case 2: case 3: case 4:
	    case 5: case 6: case 7: case 10:
	    case 17: /*h*/  case 25: /*p*/
	    case 27: /*r*/
	    if (!value) {
		if (!ch.command_memory[effect])
		    log_fix("missing_value");
		else
		    value = ch.command_memory[effect];
	    } else
		ch.command_memory[effect] = value;
	    break;
	}

	var sm = samp ? mod.sample[samp] : null;

	if (tick == notetick) {
	    var note;
	    switch (period) {
	    case 0x61: /* key off */
		ch.sustain = 0;
		/* fall-through */
	    case 0:
		note = 0;
		break;
            default:
		note=period-1;
		break;
            }

	    if (samp && sm) {
		if (note) {
		    newev.samp = ch.sample = samp;
		    ch.pattsamp = true;
		    ch.event_vol = 64;
		    ch.vol = sm.vol;
		    flush_env ("venv", "vol", ch, mod, pl);

		    ch.vibpos = 0;
		    ch.arppos = 0;

		    ch.vol_env_obj = Envelope();
		    ch.pan_env_obj = Envelope();
		    ch.sustain = 1;
		    ch.volfade = 0x8000;
		    ch.span = sm.pan;
		    ch.finetune = sm.finetune;
		} else
		    ch.vol = sm.vol;
	    }

	    if (note) {
		if (effect == 3 || effect == 5)
		    ch.slide_target = note2period(note);
		else {
		    ch.slide_target = 0;
		    
		    ch.period = ch.event_period = note2period(note);
		    newev.note = note;
			
		    //newev.samp = ch.sample;
		    flush_env ("penv", "p", ch, mod, pl);
		}
	    }

	    switch (effect) {
	    case 0:
		if (value && iparam("continuousarp",0)) {
		    var n;
		    switch (ch.arppos++ %3) {
		    case 0: n=0; break;
		    case 1: n=value>>4; break;
		    case 2: n=value & 15; break;
		    }
		    ch.penv.arp = n;
		}
		break;
	    case 8:
		ch.span = value;
		break;
	    case 9: 
		newev.effect = effect;
		newev.value = value;
		break;
	    case 12:
		if (value > 64) {
		    value = 64;
		    log_fix("volrange");
		}
		ch.vol = value;
		break;
	    case 14:
		switch (value >> 4) {
		case 1: ch.period -= value & 15; break;
		case 2: ch.period += value & 15; break;
		case 10: ch.vol += (value & 15); break;
		case 11: ch.vol -= (value & 15); break;
		case 6:
		    if (value & 15) {
			if (!ch.loopcount)
			    ch.loopcount = (value & 15)+1;
			if (--ch.loopcount)
			    pl.nextevent = ch.looppos;
		    } else {
			ch.looppos = pl.event;
		    }
		    break;
		}
		break;
	    case 11:
		pl.nextpos = value;
		if (pl.nextpos > mod.seqlen)
		    log_fix ("jump_overflow");
		effect = value = 0;
		break;

	    case 13:
		pl.nextevent = (value>>4)*10 + (value & 15);
		if ((value & 15) > 9)
		    log_fix ("pbreak_notbcd");
		if (pl.nextevent > 63) {
		    log_fix ("pbreak_overflow");
		    pl.nextevent = 0;
		}
		if (pl.nextpos == null)
		    pl.nextpos = pl.pos+1;
		break;

	    case 21: /* l */
		if (ch.vol_env_obj)
		    ch.vol_env_obj.pos = value;
		break;
	    }

	    switch (vol >> 4) {
	    case 1: case 2:
	    case 3: case 4:
		ch.vol = vol-16;
		break;
	    case 5: if (vol == 0x50)
		ch.vol = 64;
		break;
	    case 8:
		ch.vol -= (vol & 15);
		break;
	    case 9:
		ch.vol += (vol & 15);
		break;
	    case 12:
		ch.span = (vol & 15)*17;
		break;
	    }
	} else {
	    switch (effect) {
	    case 0:
		if (value) {
		    if (value % 17)
			/* FT2 (accidentally?) reversed the arp nibble
			 * ordering.  Some subsequent trackers follow
			 * FT2's mistake, others implement behaviour
			 * consistent with all other formats.
			 * 
			 * Sadly, we have no way of knowing which
			 * interpretation was intended by the tune author.
			 */
			log_fix ("arp_ambiguous");
		    var n;
		    var t = iparam("continuousarp",0)?ch.arppos++:tick;
		    switch (t %3) {
		    case 0: n=0; break;
		    case 1: n=value>>4; break;
		    case 2: n=value & 15; break;
		    }
		    ch.penv.arp = n;
		}
		break;
	    case 1: 
		ch.period -= value; break;
	    case 2:
		ch.period += value; break;
	    case 3:
		if (samp && (ch.sample != samp))
		    log_fix("porta_samp_change");
		if (!ch.command_memory[3]) {
		    log_fix("porta_speed_lacking");
		} else
		    if (!ch.slide_target) {
			log_fix("porta_target_lacking");
			effect = value = period = 0;
		    }
		/* fall-through */
	    case 5:
		period = 0;
		if (ch.slide_target && ch.command_memory[3]) {
		    if (tick) {
			for(var j=0; j<ch.command_memory[3]; j++) {
			    var diff = ch.slide_target - ch.period;
			    var sign = (diff > 0) ? 1 : (diff < 0) ? -1 : 0;
			    if (!sign) break;
			    ch.period += sign;
			}
		    }
		}
		if (effect == 3) break;
		/* fall-through */
	    case 10:
		if (!value)
		    effect = 0;
		/* fall-through */
	    case 6:
		if ((value & 15) && (value & 0xf0)) {
		    value &= 0xf0; /* high nibble takes precedence */
		    log_fix("volslideboth");
		}
		if (value & 0xf0) {
                    ch.vol += value >> 4;
		} else {
                    ch.vol -= value;
		}
		break;

	    case 17: /* h */
		if ((value & 15) && (value & 0xf0)) {
		    value &= 0xf0; /* high nibble takes precedence */
		    log_fix("volslideboth");
		}
		if (value & 0xf0) {
                    pl.global_vol += value >> 4;
		} else {
                    pl.global_vol -= value;
		}
		break;

	    case 14:
		switch (value >> 4) {
		case 13: /* note delay */
		    if (!(value & 15)) {
			effect = value = 0;
			log_fix("notedelay_zero");
		    } else if ((value & 15) >= pl.speed) {
			ch.delayedperiod = period;
			ch.delayedsamp = samp;
			period = 0;
			samp = 0;
			effect = 0;
			value = 0;
			log_fix("notedelay_overflow");
		    }
		    break;
                    /* Cut note */
		case 12: 
		    if (tick == (value & 15))
			ch.vol = 0;
		    break;
		}
		break;

	    case 20: /* k */
		if (tick == (value & 15))
			ch.sustain = 0;
		break;
	    }
	    
	    switch (vol >> 4) {
	    case 6:
		ch.vol -= (vol & 15);
		break;
	    case 7:
		ch.vol += (vol & 15);
		break;
	    }
	}

	/* every tick */
	switch (effect) {
	case 20: /* k */
	    if (tick == value) 
		ch.sustain = 0;
	    break;
	case 27: /* r */
	    if (tick % value == 0) {
		newev.effect = 9; newev.value = 0; /* FIXME! */
	    }
	case 14:
	    switch (value >> 4) {
                /* Retrig note */
	    case 9:
		if (tick % (value & 15) == 0) {
		    newev.effect = 9; newev.value = 0; /* FIXME! */
		}
		break;
	    }
	    break;

	case 4:
	case 6:
	    dovib = true;
	    break;
	}

	if (ch.vol < 0)
	    ch.vol = 0;
	if (ch.vol > 64)
	    ch.vol = 64;	

	ch.venv.vol = ch.vol/64;
	
	if (ch.sample && venv[ch.sample] && (venv[ch.sample].type & 1))
//	    ch.venv.e = envelope(venv[ch.sample], ch.env_pos++, ch.sustain)/64;
	    ch.venv.e = ch.vol_env_obj.clock(venv[ch.sample],ch.sustain)/64;
	else
	    if (!ch.sustain)
		ch.volfade = 0; /* instant keyoff */

	if (!ch.sustain) {
	    ch.volfade -= volfade[ch.sample];
	    if (ch.volfade<0) ch.volfade = 0;
	    if (ch.volfade < 0x8000)
		ch.venv.fade = ch.volfade / 0x8000;
	}
	
	if (vib[ch.sample] && vib[ch.sample].speed) {
	    ch.vibspeed = vib[ch.sample].speed/4;
	    ch.vibdepth = vib[ch.sample].depth/4;
	    dovib=true;
	}
	if (dovib) {
	    //log("dovib:"+ch.vibpos);
	    ch.vibpos += ch.vibspeed*4;
	    ch.penv.vib = relpitch (ch.period, ch.period + Math.sin(6.28*ch.vibpos/256) * ch.vibdepth);
	}
	
	if (pl.global_vol > 64)
	    pl.global_vol = 64;
	else if (pl.global_vol < 0)
	    pl.global_vol = 0;

	if (pl.global_vol != 64)
	    ch.venv.global = pl.global_vol/64;

	var epan = 0;
	if (ch.sample && penv[ch.sample] && (penv[ch.sample].type & 1)) {
	    epan = ch.pan_env_obj.clock(penv[ch.sample],ch.sustain)-32;
	}

	var fpan=ch.span+epan*(128-Math.abs(ch.span-128))/32;
	if (ch.fpan != fpan && !newev.effect) {
	    newev.effect = 8; newev.value = fpan;
	}
	ch.fpan = fpan;

	if (ch.period && ch.period != ch.event_period) {
	    if (ch.period < 1) {
		log ("period = "+ch.period);
		ch.period = 1;
	    }
	    ch.penv.p = relpitch(ch.event_period, ch.period);
	    if (!isFinite(ch.penv.p)) alert("foo:"+ch.period+" "+ch.event_period+" "+ch.penv.p);
	    if (!ch.event_period) alert(ch.event_period);
	}

	return newev;
    }

    preprocess (mod, { do_tick: do_tick,
		       init: init,
		       relpitch: relpitch,
		       getpattlen: function (pl) {
			   //log("getpattlen: pos="+pl.pos);
			   return parr[sequence[pl.pos]].length / mod.nchan;
		       }
		     });

    for (var i=1; i<=mod.nsamples; i++)
	mod.sample[i].vol = 64;
    
    return mod;
}
