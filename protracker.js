function protracker_load (buf, params) {
    var mod = Object.create(Mod.prototype);
    var file = new Uint8Array(buf);

    function readword () { var i=file[pos]*256 + file[pos+1]; pos +=2; return i*2; }
    function readbyte () { return file[pos++]; }
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

    mod.title=readstring(20);
    mod.sample=[];
    var chan=[];
    for (var i=1; i<=31; i++) {
	var s={};
	s.name= readstring(22);
	s.len = readword();
	var ft = (readbyte() & 15);
	if (ft > 7) ft -= 16;
	s.speed = 8363.422897 * Math.exp2(ft/96); /* ewwwwww */
	s.vol = readbyte();
	s.rstart = readword();
	s.rlen = readword();
	mod.sample[i] = s;
    }
    mod.seqlen = readbyte();
    pos++;
    var sequence = getptr (128);
    mod.sequence = [];
    for (var i=0; i < mod.seqlen; i++)
	mod.sequence.push(file[sequence+i]);

//    alert("pos="+pos+" 1="+file[pos]+" 2="+file[pos+1]+" 3="+file[pos+2]);

    var id=readstring(4);
    mod.nchan = parseInt(id,10) || 4;
//    alert("id="+id+" nchan="+nchan);
    var patts=0;
    for (var i=0; i<128; i++)
	if (file[sequence+i]>patts) patts=file[sequence+i];
    patts++;
    mod.npatts = patts;

    var pattern = getptr (patts * 64 * mod.nchan * 4);

    mod.initspeed = 6;
    mod.inittempo = 125;

    for (var i=1; i<=31; i++) {
	var s=mod.sample[i];
	var ptkloop = false;
	s.looptype = 1;
	if (!s.len || s.rlen <= 2) {
	    s.looptype = 0;
	} else if (s.rstart == 0 && s.rlen < s.len && mod.nchan==4) {
	    /* Protracker handles samples with zero rstart differently */
	    ptkloop = true;
	    //log_fix("ptkloop");
	}

	s.data = new Float32Array(s.len+(ptkloop?s.rlen:2));
	
        var ptr=getptr (s.len);
	for (var j=0; j<s.len; j++) {
	    var f=file[ptr+j]; s.data[j] = (f>127?f-256:f)/128;
	}
	if (ptkloop) {
	    for (var j=0; j<s.rlen; j++)
		s.data[j+s.len] = s.data[j];
	    s.rstart = s.len;
	    s.len += s.rlen;
	}
    }
    mod.chan=[];
    mod.pan = [];
    
    mod.nsamples = 31;

    for (var i=0; i<mod.nchan; i++)
	mod.pan[i] = ((i&3)%3)?-64:64;
 
   function relpitch(p1, p2) {
	return (Math.log(p1/p2) / Math.LN2) * 12;
    }

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
		    pitch_env:[], vol_env:[]
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
	if (!tick)
	    pl.eventptr = pattern + (file[sequence+pl.pos]*64 
				  + pl.event) * mod.nchan * 4;

        var ptr = pl.eventptr + chan * 4;
        var effect = file[ptr+2] & 15, value = file[ptr+3];
        var period = file[ptr+1] + ((file[ptr] & 15) << 8);
        var samp = (file[ptr+2] >> 4) + (file[ptr] & 16);
	var sm = samp ? mod.sample[samp] : null;
	var old={}; 
	old.period = ch.period;
	old.samp = ch.samp;
	old.vol = ch.vol;
	ch.arp = 0; ch.vibrato = 0;
	var newev={};
	ch.penv = []; ch.venv = [];

	var notetick = 0;
	if (effect == 14 && (value >> 4) == 13)
	    notetick = value & 15;

	ch.penv.arp = 0;

	if (tick==0) {
	    switch (effect) {
	    case 15:
		if (value < 32) {
		    pl.speed=value||255; effect = value = 0;
		} else {
		    pl.tempo = value;
		    newev.effect = effect; newev.value = value;
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

	var sm = samp ? mod.sample[samp] : null;

	if (tick == notetick) {
	    if (samp) {
		if (ch.sample != samp || !ch.pattsamp) {
		    newev.samp = ch.sample = samp;
		    ch.pattsamp = true;
		    ch.event_vol = 64;
		    ch.vol = sm.vol;
		    flush_env ("venv", "vol", ch, mod, pl);

		    ch.offset_memory = 0;
		    ch.vibpos = 0;
		    ch.finetune = sm.finetune;
		} else
		    ch.vol = sm.vol;
	    }

	    if (period) {
		if (effect == 3 || effect == 5)
		    ch.slide_target = period;
		else {
		    ch.slide_target = 0;
		    if (ch.offset_memory) {
			//newev.effect = 9; newev.value = ch.offset_memory;
		    }
		    ch.period = ch.event_period = period;
		    newev.note = mod.period2note(period);
		    //newev.samp = ch.sample;
		    //flush_env ("penv", mod, pl);
		}
	    }

	    switch (effect) {
	    case 9: 
		if (value)
		    ch.offset_memory = value;
		else {
		    if (!ch.offset_memory) {
			log_fix("offset_lacking");
			effect = value = 0;
		    } else
			value = ch.offset_memory;
		}
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
	    }
	} else {
	    switch (effect) {
	    case 0:
		if (value) {
		    var n;
		    switch (tick %3) {
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
		if (value) ch.slide_memory = value;

		if (samp && (ch.sample != samp))
		    log_fix("porta_samp_change");
		if (!ch.slide_memory) {
		    log_fix("porta_speed_lacking");
		    effect = value = period = 0;
		} else
		    if (!ch.slide_target) {
			log_fix("porta_target_lacking");
			effect = value = period = 0;
		    }
		/* fall-through */
	    case 5:
		period = 0;
		if (ch.slide_target) {
		    if (tick) {
			for(var j=0; j<ch.slide_memory; j++) {
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
                    /* Retrig note */
		case 9:
		    if (tick % (value & 15) == 0) {
			newev.effect = 9; newev.value = 0; /* FIXME! */
		    }
		    break;
                    /* Cut note */
		case 12: 
		    if (tick == (value & 15))
			ch.vol = 0;
		    break;
		}
		break;
		
	    }
	}

	switch (effect) {
	case 4:
	    if (value & 15) ch.vibdepth = value & 15;
	    if (value>>4) ch.vibspeed = value>>4;
	    if (!ch.vibspeed || !ch.vibdepth) {
		log_fix("vib_lacking");
	    }
	    /* fall-through */
	case 6:
	    ch.vibpos += ch.vibspeed*4;
	    ch.penv.vib = relpitch (ch.period, ch.period + Math.sin(6.28*ch.vibpos/256) * ch.vibdepth);
		break;
	    }


	if (ch.vol < 0)
	    ch.vol = 0;
	if (ch.vol > 64)
	    ch.vol = 64;
	
	ch.venv.vol = ch.vol/64;

	if (ch.event_period && ch.period < 1)
	    ch.period = 1;

	if (ch.period && ch.period != ch.event_period)
	    ch.penv.p = relpitch(ch.event_period, ch.period);

	return newev;
    }

    preprocess (mod, { do_tick: do_tick,
		       init: init,
		       relpitch: relpitch
		     });

    for (var i=1; i<=31; i++)
	mod.sample[i].vol = 64;

    return mod;
}
