function sid_load (buf, params) {
    var mod = Object.create(Mod.prototype);
    var file = new Uint8Array(buf);
    var pos = 0;
    function read8 () { return file[pos++]; }
    function read16 () { pos+=2; return file[pos-1]+file[pos-2]*256; }
    function readstring (ptr, size) {
	var arr = [];
	for (var i=0; i<size; i++)
	    arr[i]=file[ptr+i];
	/* latin-1 */
	return String.fromCharCode.apply(this,arr).replace(/\0.*$/g,'');
    }

    var dump;
    var playaddr;
    var initaddr;
    var loadaddr;
    var dataoff;
    var songs;
    var startsong;
    var speed;
    var version = 0;
    pos = 4;
    if (file[0] == 0x50 && 
	file[1] == 0x53 && 
	file[2] == 0x49 && 
	file[3] == 0x44) {
	dump = false;
	version = read16();
	dataoff = read16();
	loadaddr = read16();
	if (!loadaddr) {
	    loadaddr = file[dataoff]+file[dataoff+1]*256;
	    dataoff += 2;
	}
	initaddr = read16();
	playaddr = read16();
	songs = read16();
	startsong = read16();
	if (params.t) {
	    var s = parseInt(params.t,10);
	    if (s>0 && s<=songs) {
		startsong = s;
		log("forcing subsong "+s);
	    }
	}
	speed = read16()*65536;
	speed += read16();
	log ("loadaddr = "+loadaddr+" initaddr="+initaddr+" playaddr "+playaddr+" datoff "+dataoff+" speed "+speed+" startsong "+startsong);
    }
    else {
	dump = true;
    }
    var second = version>=3 && file[0x7a];
    if (second &1) second = 0;
    if (second) 
	log("second: "+second);
    
    var sequence = [];
    mod.title = dump ? "" : readstring(22,32);
    var ntsc = 0;
	
    mod.chan = [];
    mod.pan = [];
    mod.initspeed = 1;
    var cia = ((speed>>>(startsong-1)) &1);
    mod.nchan = second?6:3;
    mod.sample = [];
    mod.npatts = 1;

    /* assume v1 SIDs are PAL */
    if (version >= 2) {
	switch (file[0x77]&12) {
	    case 4:
	    ntsc = 0; break;
	    case 8:
	    ntsc = 1; break;
	    default:
	    log("unspecified video standard, assuming PAL");
	}
    }

    log ("timing: "+(ntsc?"NTSC":"PAL")+", "+(cia?"CIA":"vblank"));
    
    var env_timings = [
	9, 32, 63, 95,
	149, 220, 267, 313,
	392, 977, 1954, 3126,
	3907, 11720, 19532, 31251
    ];

    for (var i=0; i<mod.nchan; i++)
	mod.pan[i] = second?((i>2)?-64:64):0;

    var slen = 256;
    var rate = 261.62556 * slen;

    for (var i=1; i<=128; i++) {
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
	    s.data[j] = j<(i*slen/128) ? 0.5 : 0;
	}
    }

    var s = mod.sample[129] = {
	    name:'noise',
	    len:16384,
	    speed:rate/64,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:16384,
	looptype:1,
	    data:new Float32Array(16384)
    };
    for (var j=0; j<s.len; j++) {
	s.data[j] = Math.random();
    }

    var s = mod.sample[130] = {
	    name:'tri',
	    len:slen,
	    speed:rate,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:slen,
	looptype:1,

	    data:new Float32Array(slen)
    };
    for (var j=0; j<s.len; j++) {
	s.data[j] = (j > s.len/2 ? (2-j/(s.len/2)) : (j/(s.len/2)))/2;
    }

    var s = mod.sample[131] = {
	    name:'saw',
	    len:slen,
	    speed:rate,
	    vol:64, /* unused */
	    rstart:0,
	    rlen:slen,
	looptype:1,
	    data:new Float32Array(slen)
    };
    for (var j=0; j<s.len; j++) {
	s.data[j] = j/s.len/2;
    }

    mod.nsamples = 131;

    mod.ntsc = 1;
    mod.seqlen = (params.seqlen && parseInt(params.seqlen,10)) || 128;

    mod.parr = [];
    for (var i=0; i<mod.seqlen; i++)
	sequence[i] = i;
    mod.sequence = sequence;







	var rate_counter_period = [
	    9,  //   2ms*1.0MHz/256 =     7.81
	    32,  //   8ms*1.0MHz/256 =    31.25
	    63,  //  16ms*1.0MHz/256 =    62.50
	    95,  //  24ms*1.0MHz/256 =    93.75
	    149,  //  38ms*1.0MHz/256 =   148.44
	    220,  //  56ms*1.0MHz/256 =   218.75
	    267,  //  68ms*1.0MHz/256 =   265.63
	    313,  //  80ms*1.0MHz/256 =   312.50
	    392,  // 100ms*1.0MHz/256 =   390.63
	    977,  // 250ms*1.0MHz/256 =   976.56
	    1954,  // 500ms*1.0MHz/256 =  1953.13
	    3126,  // 800ms*1.0MHz/256 =  3125.00
	    3907,  //   1 s*1.0MHz/256 =  3906.25
	    11720,  //   3 s*1.0MHz/256 = 11718.75
	    19532,  //   5 s*1.0MHz/256 = 19531.25
	    31251   //   8 s*1.0MHz/256 = 31250.00
	];

	function env_reset(e) 
	{
	    e.envelope_counter = 0;

	    e.attack = 0;
	    e.decay = 0;
	    e.sustain = 0;
	    e.release = 0;

	    e.gate = 0;

	    e.rate_counter = 0;
	    e.exponential_counter = 0;
	    e.exponential_counter_period = 1;

	    e.state = 3 /*RELEASE*/;
	    e.rate_period = rate_counter_period[e.release];
	    e.hold_zero = true;
	}

	function env_write (e, reg, val) {
	    switch (reg) {
	    case 4: /* control */
		var gate_next = val & 0x01;

		// The rate counter is never reset, thus there will be a delay before the
		// envelope counter starts counting up (attack) or down (release).

		// Gate bit on: Start attack, decay, sustain.
		if (!e.gate && gate_next) {
		    e.state = 0 /*ATTACK*/;
		    e.rate_period = rate_counter_period[e.attack];

		    // Switching to attack state unlocks the zero freeze.
		    e.hold_zero = false;
		}
		// Gate bit off: Start release.
		else if (e.gate && !gate_next) {
		    e.state = 3/*RELEASE*/;
		    e.rate_period = rate_counter_period[e.release];
		}
		
		e.gate = gate_next;
		break;
	    case 5: /* attack, delay */
		e.attack = (val >> 4) & 0x0f;
		e.decay = val & 0x0f;
		if (e.state == 0/*ATTACK*/) {
		    e.rate_period = rate_counter_period[e.attack];
		} else if (e.state == 1/*DECAY_SUSTAIN*/) {
		    e.rate_period = rate_counter_period[e.decay];
		}
		break;
	    case 6: /* sustain, release */
		e.sustain = (val >> 4) & 0x0f;
		e.release = val & 0x0f;
		if (e.state == 3 /*st.RELEASE*/)
		    e.rate_period = rate_counter_period[e.release];
		break;
	    }
//	    log("att "+e.attack+" dec "+e.decay+" sus "+e.sustain+" rel "+e.release+" state "+e.state);
	}

	/* clock the envelope generator for a specified number of cycles and return the output */
	function clock_env (e, cyc) {
	    // Check for ADSR delay bug.
	    // If the rate counter comparison value is set below the current value of the
	    // rate counter, the counter will continue counting up until it wraps around
	    // to zero at 2^15 = 0x8000, and then count rate_period - 1 before the
	    // envelope can finally be stepped.
	    // This has been verified by sampling ENV3.
	    //
	    var st = { ATTACK:0, DECAY_SUSTAIN:1, RELEASE:3 };
	    // NB! This requires two's complement integer.
	    var rate_step = e.rate_period - e.rate_counter;
	    if (rate_step <= 0) {
		/* H: disable ADSR bug emulation in attack phase for now, it makes the resulting
		 * volenvs way too numerous.  The correct solution is to delay note events
		 * until the attack phase is actually triggered. 
		 */
		if (e.state == st.ATTACK)
		    rate_step = 0;
		else
		    rate_step += 0x7fff;
	    }

	    while (cyc) {
		if (cyc < rate_step) {
		    e.rate_counter += cyc;
		    if (e.rate_counter & 0x8000) {
			++e.rate_counter; e.rate_counter &= 0x7fff;
		    }
		    return e.envelope_counter;
		}

		e.rate_counter = 0;
		cyc -= rate_step;

		// The first envelope step in the attack state also resets the exponential
		// counter. This has been verified by sampling ENV3.
		//
		if (e.state == st.ATTACK	|| ++e.exponential_counter == e.exponential_counter_period)
		{
		    e.exponential_counter = 0;

		    // Check whether the envelope counter is frozen at zero.
		    if (e.hold_zero) {
			rate_step = e.rate_period;
			continue;
		    }

		    switch (e.state) {
		    case st.ATTACK:
			// The envelope counter can flip from 0xff to 0x00 by changing state to
			// release, then to attack. The envelope counter is then frozen at
			// zero; to unlock this situation the state must be changed to release,
			// then to attack. This has been verified by sampling ENV3.
			//
			++e.envelope_counter; e.envelope_counter &= 0xff;
			if (e.envelope_counter == 0xff) {
			    e.state = st.DECAY_SUSTAIN;
			    e.rate_period = rate_counter_period[e.decay];
			}
			break;
		    case st.DECAY_SUSTAIN:
			if (e.envelope_counter != e.sustain*17) {
			    --e.envelope_counter;
			}
			break;
		    case st.RELEASE:
			// The envelope counter can flip from 0x00 to 0xff by changing state to
			// attack, then to release. The envelope counter will then continue
			// counting down in the release state.
			// This has been verified by sampling ENV3.
			// NB! The operation below requires two's complement integer.
			//
			--e.envelope_counter; e.envelope_counter &= 0xff;
			break;
		    }

		    // Check for change of exponential counter period.
		    switch (e.envelope_counter) {
		    case 0xff:
			e.exponential_counter_period = 1;
			break;
		    case 0x5d:
			e.exponential_counter_period = 2;
			break;
		    case 0x36:
			e.exponential_counter_period = 4;
			break;
		    case 0x1a:
			e.exponential_counter_period = 8;
			break;
		    case 0x0e:
			e.exponential_counter_period = 16;
			break;
		    case 0x06:
			e.exponential_counter_period = 30;
			break;
		    case 0x00:
			e.exponential_counter_period = 1;

			// When the envelope counter is changed to zero, it is frozen at zero.
			// This has been verified by sampling ENV3.
			e.hold_zero = true;
			break;
		    }
		}

		rate_step = e.rate_period;
	    }

	    return e.envelope_counter;
	}


    function reg_write(pl, reg, val) {
	var regs, c;
	switch (reg & 0xfe0) {
	    case 0xc00: /* CIA */
	    if (cia) {
		switch (reg & 0x1f) {
		case 4: pl.timer = (pl.timer & 0xff00)+val; break;
		case 5: pl.timer = (pl.timer & 0xff)+(val<<8); break;
		}
	    }
	    return;
	    
	    case 0x400: regs = pl.sidregs; c=0; break;
	    case (second<<4): if (second) { regs = pl.sidregs2; c=3; break; }
	    default: return;
	}
	reg &= 0x1f;
	
//	log ("reg_write: "+reg+" "+val+ "c="+c);
	if (reg < 0x15) {
	    c += (reg / 7) | 0;
	    var off = reg % 7;
	    env_write (pl.chan[c].env, off, val);
	    if (off == 4) {
		if (val & 1) {
		    if (!(regs[reg] & 1))
			pl.gate[c] = true;
		}
	    }
	}

	regs[reg] = val;
    }

    function factor(n) {
	var f=[];
	if (n < 2) return [];
	while (!(n &1))
	    f.push(2), n>>>=1;
	for (i=3; n>1 && i*i<=n; i+=2)
	    while (!(n % i))
		f.push(i), n/=i;
	if (n>1)
	    f.push(n);
	return f;
    }

/*
    var hash=[];
    var state=[];
    if (!dump) {
	var st=[];
	var lstart, llen;
	var cpu = new CPU6502(function (a, v) {
				  st.push(a);
				  st.push(v);
			      });
	for (var i=0; i<file.length-dataoff; i++)
	    cpu.RAM[i+loadaddr] = file[i+dataoff];
	hash[cpu.run(initaddr,startsong-1)]=0;
	var frame=0, st=[], h=cpu.run(initaddr,startsong-1);
	for (;;) { 
	    if (hash[h]!==undefined)
		break;
	    hash[h]=frame;
	    if (st.length) log (frame+" "+st.length);
	    state[frame]=st;
	    frame++; st=[]; h=cpu.run(playaddr);
	}
	lstart = hash[h]-1; llen = frame-hash[h];
	log ("lstart = "+lstart+" lend = "+lend);
    }
*/
    function init(pl) {
	pl.speed = mod.initspeed; pl.tempo = mod.inittempo;
	pl.pattdelay = 0;
	for (var i=0; i<mod.nchan; i++) {
	    var c={ period:0, sample:0, soffset:0,
		    pan:mod.pan[i], finetune:0,
		    lastsamp:0,
		    wave:0,
		    arp:0,
		    env:{}, pitch_env:[], vol_env:[]
		  };
	    pl.chan[i] = c;
	    env_reset(c.env);
	}

	pl.lastevent = null;
	pl.sidregs = new Uint8Array(32);
	if (cia)
	    pl.timer = 17095;
	else 
	    pl.timer = ntsc ? 17045 : 19656;
	if (second)
	    pl.sidregs2 = new Uint8Array(32);
	pl.gate = [false, false, false];
	pl.release = [false, false, false];
	pl.frame = 0;
	pl.hash = [];

	if (!dump) {
	    pl.cpu = new CPU6502(function (a, v) {
				     reg_write(pl, a, v);
				 });
	    for (var i=0; i<file.length-dataoff; i++)
		pl.cpu.RAM[i+loadaddr] = file[i+dataoff];
	    pl.hash[pl.cpu.run(initaddr,startsong-1)]=0;
	}
	mod.inittempo = (ntsc ? 1022700 : 985248) / pl.timer * 125 / 50;	
    }

    function relpitch(p1, p2) {
	if (!p2) p2=p1;
//	log ("relpitch: "+p1+" "+p2);
	return (Math.log(p2/p1) / Math.LN2) * 12;
    }
    
    function pitch2note (pitch) {
	return (Math.log(pitch/277.18) / Math.LN2) * 12;
    }
    var dupfound=false;
    function do_tick(mod, pl, chan, event, tick, log_fix, flush_env) {
	/* event is assumed to increase monotonically */
	if (pl.lastevent != event) {
	    pl.lastevent = event;
	    /* read a new frame */
	    if (dump) {
		do {
		    var reg = read8();
		    var val = read8();
		    if (reg < 0x20)
			reg_write(pl, 0x400+reg, val);
		} while (reg < 0x20);
	    } else {
		var hash=pl.cpu.run(playaddr);
//		log("frame:"+pl.frame+" hash:"+hash);
		if (pl.hash[hash]!==undefined && !dupfound) {
		    log ("hash dup found: "+pl.hash[hash]+" "+pl.frame);
		    dupfound=true;
		}
		else
		    pl.hash[hash]=pl.frame;
	    }
	    pl.frame++;
	}

	var ch = pl.chan[chan];
	var newev={};
	ch.penv = []; ch.venv = [];

	var regs = (chan >= 3) ? pl.sidregs2: pl.sidregs;
	var base = ((chan %3) * 7);
	var pitch = regs[base] + regs[base+1] * 256;
	if (ch.event_period)
	    ch.period = pitch;
	var sample;
	var wave = regs[base+4] >> 4;
	switch (wave) {
	case 0: /* off */
	    sample = 0; break;
	case 1: /* tri */
	case 5: /* FIXME: tri+sq (a common occurence worth special-casing for now) */
	    sample = 130; break; 
	case 2: /* saw */
	    sample = 131; break; 
	case 4: /* square */
	    var pwm = regs[base+2] + (regs[base+3] &15) * 256;
	    sample = Math.floor(pwm / 32) + 1;
	    break;
	case 8: /* noise */
	    sample = 129; break;
	default: 
	    log("mix: "+wave);
	    sample = 65; //ch.env_phase = 0;
	    break;
	}
	if (sample && (ch.sample != sample || pl.gate[chan])) {
	    newev.samp = ch.sample = sample;
	    if (ch.wave != wave) {
		ch.wave = wave;
		//flush_env ("venv", "vol", ch, mod, pl);
	    }
	}
	if (pl.gate[chan] && pitch) {
	    pl.gate[chan] = false;
//	    if (!ch.pattsamp) newev.samp = ch.sample = 64;
//	    ch.pattsamp = true;
	    flush_env ("venv", "env", ch, mod, pl);
	    //ch.vol_env = null;
	    ch.period = ch.event_period = pitch;
	    newev.note = pitch2note(pitch);
//	    log ("ch="+chan+" pitch="+pitch+" note="+newev.note);
	    //flush_env ("penv", "pitch", ch, mod, pl);	    
	}

	/* This samples env output at the *end* of a tick, which is suboptimal.
	 * Should be fixed with finer env resolution.
	 */
	ch.venv.env = clock_env(ch.env, pl.timer) / 256;
	if (!sample)
	    ch.venv.env = 0;

	if ((regs[24] & 15) != 15)
	    ch.venv.global = (regs[24] & 15) / 15;

	if (!wave) ch.venv.env = 0;
	
	if (ch.period && ch.period != ch.event_period)
	    ch.penv.p = relpitch(ch.event_period, ch.period);

//	if (chan==2)log ("ch="+chan+" env_phase="+ch.env_phase+" vol="+ch.vol);
	return newev;
    }

    preprocess (mod, { init: init,
		       do_tick: do_tick,
		       relpitch: relpitch,
		       getpattlen: function() { return 32*6 }
		     });

    return mod;
}
