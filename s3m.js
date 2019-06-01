var cp437_hi = [
    0xc7, 0xfc, 0xe9, 0xe2, 0xe4, 0xe0, 0xe5, 0xe7, 0xea, 0xeb, 0xe8, 0xef, 0xee, 0xec, 0xc4, 0xc5,
    0xc9, 0xe6, 0xc6, 0xf4, 0xf6, 0xf2, 0xfb, 0xf9, 0xff, 0xd6, 0xdc, 0xa2, 0xa3, 0xa5, 0x20a7, 0x192,
    0xe1, 0xed, 0xf3, 0xfa, 0xf1, 0xd1, 0xaa, 0xba, 0xbf, 0x2310, 0xac, 0xbd, 0xbc, 0xa1, 0xab, 0xbb,
    0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562, 0x2556, 0x2555, 0x2563, 0x2551, 0x2557, 0x255d, 0x255c, 0x255b, 0x2510,
    0x2514, 0x2534, 0x252c, 0x251c, 0x2500, 0x253c, 0x255e, 0x255f, 0x255a, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256c, 0x2567,
    0x2568, 0x2564, 0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256b, 0x256a, 0x2518, 0x250c, 0x2588, 0x2584, 0x258c, 0x2590, 0x2580,
    0x3b1, 0xdf, 0x393, 0x3c0, 0x3a3, 0x3c3, 0xb5, 0x3c4, 0x3a6, 0x398, 0x3a9, 0x3b4, 0x221e, 0x3c6, 0x3b5, 0x2229, 0x2261, 0xb1, 0x2265, 0x2264, 0x2320, 0x2321, 0xf7, 0x2248, 0xb0, 0x2219, 0xb7, 0x221a, 0x207f, 0xb2, 0x25a0, 0xa0
];

/* tests:
 * chromosp.s3m seq. 30: patt delay with fine vol slide
 * jupiter.s3m seq. 12: pitch slide speed
 * skyscraperremix.s3m start: low octave
 */

function volslideup(pl) {
    var ch = pl.chan[chan];
}

function s3m_load (buf) {
    var mod = Object.create(Mod.prototype);
    var file = new Uint8Array(buf);

    function read16l () { var i=file[pos] + file[pos+1]*256; pos +=2; return i; }
    function read32l () { var i=file[pos] + (file[pos+1]<<8) + (file[pos+2]<<16) + (file[pos+3]<<24); pos +=4; return i; }
    function read8 () { return file[pos++]; }
    function readstring (size) {
	var ptr=getptr(size);
	var arr = [];
	for (var i=0; i<size; i++) {
	    arr[i]=file[ptr+i];
	    if (arr[i] & 0x80)
		arr[i] = cp437_hi[arr[i]-0x80];
	}

	return String.fromCharCode.apply(this,arr).replace(/\0.*$/g,'');
    }
    function getptr (size) { return (pos += size) - size; }
    var pos = 0;

    var s3m = {
	title: readstring(28),         /* Song name */
	u1: read8(),                   /* 0x1a */
	type: read8(),                /* File type */
	res: read16l(),                         /* Reserved */
	ordnum: read16l(),            /* Number of orders (must be even) */
	insnum: read16l(),            /* Number of instruments */
	patnum: read16l(),            /* Number of patterns */
	flags: read16l(),             /* Flags */
	version: read16l(),           /* Tracker ID and version */
	ffi: read16l(),               /* File format information */
	magic: readstring(4),             /* 'SCRM' */
	gv: read8(),                  /* Global volume */
	is: read8(),                  /* Initial speed */
	it: read8(),                  /* Initial tempo */
	mv: read8(),                  /* Master volume */
	uc: read8(),                  /* Ultra click removal */
	dp: read8(),                  /* Default pan positions if 0xfc */
    };
    pos += 8; /* reserved */
    pos += 2; /* special */

    var chset = getptr(32);
    for (var i=0;i<16; i++)
	if (!(file[chset+i] & 128))
	    mod.nchan = i+1;

    var sequence = new Uint8Array (buf, pos, s3m.ordnum);
    mod.title = s3m.title;
    mod.chan = [];
    mod.pan = [];
    mod.initspeed = s3m.is;
    mod.inittempo = s3m.it;

    pos += s3m.ordnum;
    
    var iptr=[], pptr=[];

    for (var i=1;i<=s3m.insnum; i++)
	iptr[i]=read16l()*16;
    for (var i=0;i<s3m.patnum; i++)
	pptr[i]=read16l()*16;

    log("version: "+s3m.version+" flags: "+s3m.flags);

//    alert (s3m.insnum+" insts "+s3m.patnum+" patts");
//    alert(iptr.join(" "));
    var patmp = [];
    mod.sample = [];
    mod.npatts = s3m.patnum;

    /* CHECKME */
    for (var i=0; i<mod.nchan; i++)
	mod.pan[i] = (s3m.mv & 128) ? ((file[chset+i] & 8)?64:-64) : 0;

    if (s3m.dp == 0xfc) {
	var pan = getptr (32);
	for (var i=0; i<mod.nchan; i++) {
	    var p=file[pan+i];
	    if (p & 32)
		mod.pan[i] = (p & 15)*17-128;
	}
    }

    for (var i=0; i<s3m.patnum; i++) {
	var p = new Array(64 * 16 * mod.eventsize);
	pos = pptr[i];

	if (pos) {
	    var plen = read16l() - 2;
	    for (var r=0; r < 64; r++) {
		while (b = read8()) {
		    var note = 0, samp = 0, vol = 0, effect = 0, value = 0;
		    var c = (b & 0x1f); /* chanmask */
		    var ptr = (c + r * 16) * mod.eventsize;
		    
		    if (b & 0x20) { /* Note and instrument follow */
			note = read8();
			switch (note) {
			    case 255:
			    note = 0;
			    break;
			    case 254: /* key off */
			    note = 0; vol = 1;
			    break;
			    default:
			    note = (12 * (note >> 4)) + (note & 15);
			    if (note < 0) note = 0; /* FIXME */
			    break;
			}
			samp = read8();
		    }
		    
		    if (b & 0x40) { /* Volume follows */
			vol = read8()+1;
		    }
		    if (b & 0x80) { /* Effect and parameter follow */
			effect = read8();
			value = read8();
		    }
		    mod.packevent(p, ptr,
				  {note:note, samp:samp, vol:vol,
				   effect:effect, value:value});
		}
	    }
	}
	patmp[i] = p;
    }

    for (var i=1; i<=s3m.insnum; i++) {
	var s={};
	pos = iptr[i];
/* OPL
	readstring (12);
	pos += 3;
	pos += 12;
	s.vol = read8 ();
	pos++; // dsk
	pos += 2; // ?
	pos += 2; // C4spd
	pos += 2; // ?
	pos += 12; //reserved
	s.name = readstring(28);
	var magic = readstring (4);
	alert(i+" "+magic);
 */
	pos++;
	readstring(13);
	var dptr = read16l()*16;
	s.len = read32l();
	s.rstart = read32l();
	s.rlen = read32l() - s.rstart;
	s.vol = read8();
	pos++; // reserved
	pos++; // packtype
	var flags = read8();
	s.looptype = flags & 1;
	s.speed = read16l(); // C4spd
	pos += 2; // reserved
	pos += 4; // reserved
	pos += 8; // internal
	s.name = readstring (28);
	var magic = readstring (4);
	s.data = new Float32Array (s.len+2);
	if (flags & 4) {
	    /* 16 bit */
	    for (var j=0; j<s.len; j++)
		s.data[j] = (file[dptr+j*2]+file[dptr+j*2+1]*256-32768)/32768;
	} else {
	    for (var j=0; j<s.len; j++)
		s.data[j] = (file[dptr+j]-128)/128;
	}
	
	mod.sample[i] = s;
    }

    mod.ntsc = 1;
    mod.nsamples = s3m.insnum;
    mod.seqlen = s3m.ordnum;

    mod.parr = [];
    mod.sequence = sequence;

/*	if (sequence[mod.pos] == 254) {
	    mod.pos++;
	    continue;
	}

	if (sequence[mod.pos] == 255)
	    break;
*/

    function init(pl) {
	pl.speed = mod.initspeed; pl.tempo = mod.inittempo;
	pl.pattdelay = 0;
	for (var i=0; i<mod.nchan; i++) {
	    var c={ period:0, sample:0, soffset:0, vol:0,
		    pan:mod.pan[i], finetune:0,
		    offset_memory:0, slide_memory:0, slide_target:0,
		    looppos:0, loopcount:0,
		    vibpos:0, vibspeed:0, vibdepth:0,
		    trempos:0, tremspeed:0, tremdepth:0,
		    lastsamp:0,
		    volslide_memory:0,
		    slide_memory:0,
		    arp_memory:0,
		    pitch_env:[], vol_env:[]
		  };
	    pl.chan[i] = c;
	}
	pl.global_vol = s3m.gv;
    }

    function relpitch(p1, p2) {
	return (Math.log(p1/p2) / Math.LN2) * 12;
    }
    
    function note2period (note) {
	return 4*1712 / Math.exp2(note/12);
    }

    function do_tick(mod, pl, chan, event, tick, log_fix, flush_env) {
	switch (sequence[pl.pos]) {
	    case 254:
	    pl.nextevent = 0;
	    pl.nextpos = pl.pos+1;
	    return null;
	    case 255:
	    pl.nextevent = 0;
	    pl.nextpos = mod.seqlen;
	    return null;
	}
	var eventptr =  event * 16 * mod.eventsize;
	var ch = pl.chan[chan];
	var ptr = eventptr + chan * mod.eventsize;
	var patt = patmp[sequence[pl.pos]] || [];
	var newev={};
	ch.venv=[]; ch.penv=[];

	var o = mod.unpackevent (patt, ptr);
	if (!o) o=[];
	var note = o.note, samp = o.samp, vol = o.vol;
	var effect = o.effect, value = o.value;

	var sm = samp ? mod.sample[samp] : null;
	ch.arp = 0;

	if (tick == 0) {
	    switch (effect) {
	    case 1:
		pl.speed = value; effect = value = 0;
		break;
	    case 2:
		pl.nextpos = value;
		if (pl.nextpos > pl.seqlen)
		    log_fix ("jump_overflow");
		effect = value = 0;
		break;
		
	    case 3:
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
		
	    case 19:
		switch (value >> 4) {
		case 11: 
		    if (value & 15) {
			if (!ch.loopcount)
			    ch.loopcount = (value & 15)+1;
			if (--ch.loopcount)
			    pl.nextevent = ch.looppos;
		    } else {
			ch.looppos = pl.event;
		    }
		    break;
		case 8: case 12: case 13: break;
		case 14: /* pattern delay */
		    /* CHECKME! what effects are repeated?
		     * fine volslide is. note/samp probably aren't
		     * */
		    if (value & 15)
			if (!pl.pattdelay)
			    pl.pattdelay = (value & 15) + 1;
		    if (--pl.pattdelay)
			event--;
		    effect = value = 0;
		    break;
		    //default: effect = value = 0; break;
		}
		break;
	    case 20: newev.effect = 15; newev.value = value;
		break;
	    case 22: pl.global_vol = value;
		break;
	    }
	}

	var sm = samp ? mod.sample[samp] : null;
	var notetick = 0;
	if (effect == 19 && (value >> 4) == 13)
	    notetick = value & 15;

	if (tick == notetick) {
	    if (sm) {
		if (ch.sample != samp || !ch.pattsamp) {
		    newev.samp = ch.sample = samp;
		    ch.pattsamp = true;
		    ch.event_vol = 64;
		    ch.vol = sm.vol;
		    flush_env ("venv", "vol", ch, mod, pl);
		    
		    ch.vibpos = 0;
		    ch.finetune = sm.finetune;
		} else
		    ch.vol = sm.vol;
	    }
	    
	    if (note) {
		if (effect == 7 || effect == 12)
		    ch.slide_target = note2period(note);
		else
		{
		    ch.slide_target = 0;
		    
		    ch.period = ch.event_period = note2period(note);
		    newev.note = note;
		    
		    //newev.samp = ch.sample;
		    flush_env ("penv", "p", ch, mod, pl);
		}
	    }
	    
	    if (vol)
		ch.vol = vol-1;

	    switch (effect) {
	    case 15:
		if (value)
		    ch.offset_memory = value;

		if (!ch.offset_memory) {
		    log_fix("offset_lacking");
		} else {
		    newev.effect = 9;
		    newev.value = ch.offset_memory;
		}
		break;
	    case 4: //volsl
		if (!value)
		    value = ch.volslide_memory;
		else
		    ch.volslide_memory = value;
		if ((value & 0xf0) == 0xf0 && (value & 15)) {
		    ch.vol -= (value & 15);
		} else if ((value & 0xf) == 0xf && (value & 0xf0)) {
		    ch.vol += (value >> 4);
		}
		break;
	    case 5: //psldown
	    case 6: //pslup
		if (!value)
		    value = ch.slide_memory;
		else
		    ch.slide_memory = value;
		/* CHECKME */
		if ((value & 0xf0) == 0xf0) {
		    ch.period += (value & 15) * (effect == 5 ? 1 : -1);
		} else if ((value & 0xf0) == 0xe0) {
		    ch.period += (value & 15) * (effect == 5 ? 0.25 : -0.25);
		}
		break;
	    case 19:
		switch (value >> 4) {
		case 8:
		    newev.effect = 8;
		    newev.value = (value & 15) * 17;
		    break;
		}
		break;
	    }
	} else {
	    switch (effect) {
	    case 5: //pslidedown
		if (!value)
		    value = ch.slide_memory;
		else
		    ch.slide_memory = value;

		if ((value & 0xf0) < 0xe0)
		    ch.period += value;
		break;
	    case 6: //pslideup
		if (!value)
		    value = ch.slide_memory;
		else
		    ch.slide_memory = value;

		if ((value & 0xf0) < 0xe0)
		    ch.period -= value;
		break;

	    case 7: //porta
		if (value)
		    ch.slide_memory = value;
		else {
		    if (!ch.slide_memory) {
			effect = value = note = 0;
			log_fix("porta_speed_lacking");
		    }
		    value = ch.slide_memory;
		}
		
		if (samp && (ch.sample != samp))
		    log_fix("porta_samp_change");
		
		if (!ch.slide_target) {
		    log_fix("porta_target_lacking");
		    break;
		}
		/* fall-through */
	    case 12: //porta+volsl
		/* CHECKME */
		if (!value || effect != 12)
		    value = ch.volslide_memory;
		else
		    ch.volslide_memory = value;

		if (ch.slide_target) {
		    if (tick) {
			var diff = ch.slide_target - ch.period;
			var sign = (diff > 0) ? 1 : (diff < 0) ? -1 : 0;
			if (Math.abs(diff) < ch.slide_memory)
			    ch.period = ch.slide_target;
			else
			    ch.period += ch.slide_memory*sign;
		    }
		}
		if (effect == 7)
		    break;
		/* fall-through */
	    case 11: //vib+volsl
	    case 4: //volsl
		if (!value)
		    value = ch.volslide_memory;
		else
		    ch.volslide_memory = value;
		if (!value) {
		    log_fix("volslide_lacking");
		    break;
		}
		if ((value & 0xf0) && (value & 15)) {
		    /* nothing */
		} else if ((value & 0xf) == 0xf && (value & 0xf0)) {
		    /* nothing */
		} else {
		    if ((value & 15) && (value & 0xf0)) {
			value &= 0xf0; /* high nibble takes precedence */
			log_fix("volslideboth");
		    }
		    if (value & 0xf0) {
			ch.vol += value >> 4;
		    } else {
			ch.vol -= value;
		    }
		}
		break;
	    case 17: //retrig
		if (tick % (value & 15) == 0)
		    newev.effect = 9; newev.value = 0; /* FIXME! */
		break;
	    case 10: //arp 
		if (value)
		    ch.arp_memory = value;
		else
		    value = ch.arp_memory;
		switch (pl.tick %3) {
		case 0: ch.penv.arp = 0; break;
		case 1: ch.penv.arp = value>>4; break;
		case 2: ch.penv.arp = value & 15; break;
		}
		break;
	    }
	    /*
	     case 8: //vib
	     effect = 4; break;
	     case 9: effect = value = 0; /* FIXME */ //break;
	    /*		case 18: //trem
	     effect = 7; break;
	     case 21: effect = value = 0; break;
	     case 22: effect = value = 0; break;
	     default: effect = value = 0; break;
	     */
	}

	if (ch.event_period && ch.period < 1)
	    ch.period = 1;

	if (ch.vol < 0)
	    ch.vol = 0;
	if (ch.vol > 64)
	    ch.vol = 64;
	
	ch.venv.vol = ch.vol/64;
	if (pl.global_vol != 64)
	    ch.venv.global = pl.global_vol / 64;

	if (ch.period && ch.period != ch.event_period)
	    ch.penv.p = relpitch(ch.event_period, ch.period);

	return newev;
    }

    preprocess (mod, { init: init,
		       do_tick: do_tick,
		       relpitch: relpitch
		     });

    return mod;
}
