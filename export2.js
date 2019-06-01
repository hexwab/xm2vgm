//"use strict";
var Mod = function (file, params) {
    var mod;
    var t=Date.now();
    if (new Uint32Array(file,44,4)[0] == 0x4d524353)
	mod = s3m_load(file, params);
    else
	if (new Uint32Array(file,0,4)[0] == 0x65747845) /* FIXME */
	    mod = xm_load(file, params);
    else
	if (new Uint32Array(file,0,4)[0] == 0x4e4f4d08) /* FIXME */
	    mod = mt_load(file, params);
    else
	if (new Uint32Array(file,0,4)[0] == 0x44646973 ||
	    new Uint32Array(file,0,4)[0] == 0x44495350)
	    mod = sid_load(file, params);
    else
	if (new Uint32Array(file,0,4)[0] == 0x44736267 ||
	    new Uint32Array(file,0,4)[0] == 0x01534247)
	    mod = gbs_load(file, params);
    else
	if (new Uint32Array(file,0,4)[0] == 0x206d6756)
	    mod = vgm_load(file, params);
    else
//	if (new Uint32Array(file,0,4)[0] == 0x6d783f3c)
	if (new Uint32Array(file,0,4)[0] == 0x04034b50)
	    mod = xrns_load(file, params);
    else
	if (params.paula!==undefined)
	    mod = amiga_load(file, params);
    else
	mod = protracker_load(file, params);

    for (var i=1; i<mod.nsamples; i++) {
	var s=mod.sample[i];
	if (s.looptype && (s.rstart+s.rlen > s.len))
	    throw new Error ("loop out of bounds "+i);
	for (var j=0; j<s.len; j++) {
	    if (!isFinite(s.data[j]))
		throw new Error("missing sample data "+i+" "+j);
	}
	
    }

    for (var i=0; i<mod.nchan; i++) {
	if (!isFinite(mod.pan[i]))
	    throw new Error("missing panning data "+i);
    }

    mod.pitchadj = parseInt(params.pitchadj) || 0;
    mod.volthresh = parseInt(params.volthresh) || 0;
    mod.tempoadj = parseFloat(params.tempoadj) || 1;
    mod.chanmap = (params.chanmap||"0,1").split(',').map((x)=>parseInt(x));
    log(mod.chanmap);    
    log ("loading took "+(Date.now()-t)+" ms");
    return mod;
};

var tuning_table=new Float32Array(16);
var arpeggio_table=new Float32Array(16);

if (typeof Math.exp2 !== 'function') {
    var ln2 = Math.LN2;
    Math.exp2 = function(l) { return Math.exp(ln2*l); };
}

var FREQ;

function init_tuning(freq)
{
    FREQ = freq;
    for (var i=0; i<16; i++) {
	tuning_table[i] = Math.exp2(((i>=8 ? (i-16) : i)) / 96.0) / freq;
	arpeggio_table[i] = Math.exp2(i / 12.0);
    }
}

Mod.prototype = {
    eventsize: 1,

    /* FIXME! envelope storage needs rethinking */
    packevent: function (buf, off, data) {
	var d={};
	var f = false;
	if (data.note) d.note = data.note, f = true;
	if (data.samp) d.samp = data.samp, f = true;
	if (data.vol) d.vol = data.vol , f = true;
	if (data.effect || data.value) {
	    d.effect = data.effect || 0;
	    d.value = data.value || 0;
	    f = true;
	}
	if (data.penv) d.penv = data.penv, f = true;
	if (data.venv) d.venv = data.venv, f = true;
	buf[off] = f ? d : undefined;
    },

    unpackevent: function (buf, off) {
	return buf[off] || {};
    },

    period2note: function (period) {
	if (period)
	    return Math.floor(-Math.log((period/1712/4))/Math.LN2*12+.5);
	
	return 0;
    },
    
    note2period: function (note) {
	return 4*1712 / Math.exp2(note/12);
    },
    
    notename: function(note) {
	if (note)
	    return ["C-","C#","D-","D#","E-","F-","F#","G-","G#","A-","A#","B-"][Math.floor(note%12)]+Math.floor(note/12);
	
	return "   ";
    },
    
    eventstring: function(ptr, poff) {
	var mod=this;
	var hex = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p"];
	var row=[];
	for (var i=0; i<mod.nchan; i++) {
	    var e = mod.unpackevent (ptr,poff);
	    if (!ptr[poff]) {
		row.push(null);
	    } else {
		var venv, penv;
		/* FIXME: show multiple envs */
		if (e.env) {
		    for (var q=0; q<e.env.length; q++) {
			switch (e.env[q].type) {
			    case "venv": venv = e.env[q].num; break;
			    case "penv": penv = e.env[q].num; break;
			}
		    }
		}
//		var v = (e.vol) ? hex[(e.vol-1)>>4]+hex[(e.vol-1)&15] : "  ";
		var v = (venv) ? (venv<10?"0":"")+venv : "  ";
		var p = (penv) ? (penv<10?"0":"")+penv : "  ";
		var ef = (e.effect || e.value) ? hex[e.effect&31]+hex[e.value>>4]+hex[e.value&15] : "   ";
		var r=mod.notename(e.note)+" "+(e.samp?((e.samp<10?"0":"")+e.samp):"  ")+" "+v+" "+p+ " "+ef;
		row.push(r);
	    }
	    poff += mod.eventsize;
	}
	return row;
    },

/*
    envsize: 4,

    unpackenv: function (ptr, off) {
	ptr[off+0] + ptr[off+1] 
    },

    packenv: function (ptr, off) {
	
    },
*/
    envelope: function (env, off) {
	for (var i=1; i<env.length; i++) {
	    if (env[i].off > off)
		break;
	}
//	if (!env[i-1] || !env[i-1].val)	alert ("off:" +off+" i="+i+ "len="+env.length); //+" pos="+env[i].off+" val="+env[i].val);
	return env[i-1].val;
    },
};

var Player = function(mod) {
    var pl=Object.create(Player.prototype);
    pl.mod=mod;
    pl.init();

    pl.playing = true;

    return pl;
};

Player.prototype = {
    play: function () {
	var pl=this;
	var mod=pl.mod;
	var outbuf = [];
	var outptr=0;

	if (!pl.playing) return 0;
	while (1) {
	    pl.tempoadj_count += mod.tempoadj;
	    while (pl.tempoadj_count > 0) {
		pl.tempoadj_count--;
	    if (++pl.tick >= (pl.pattdelay+1)) {
		pl.tick = 0;
		pl.pattdelay = 0;
		if (!pl.patt || ++pl.event >= pl.patt.length/mod.eventsize/mod.nchan) {
  		    pl.event = 0;
		    if (pl.patt && (++pl.pos >= mod.seqlen)) {
			if (!pl.loop) { pl.playing=false; return outbuf; }
			pl.pos = mod.restartpos || 0;
		    }
		}
		pl.patt = mod.parr[mod.sequence[pl.pos]];
		pl.pattptr = pl.event * mod.nchan * mod.eventsize;
	    }
	    
	    for (var chan=0; chan<mod.nchan; chan++) {
		var ch = pl.chan[chan];
		var ptr = pl.pattptr + chan * mod.eventsize;
		var o = mod.unpackevent(pl.patt, ptr);
		var effect = o.effect, value = o.value;
		var period = o.note ? (7680 - o.note*16) : 0; // * mod.note2period(o.note);
		var samp = o.samp;
		var vol = o.vol;
		var sm = samp ? mod.sample[samp] : null;
		
		var oldsamp = ch.sample, oldoff = ch.soffset, oldvol = ch.vol;
		
		/* update envelopes */
		for (var e=0; e<ch.env.length; e++) {
		    var env = ch.env[e];
		    env.off++;
		    if (--env.len <= 0)
			ch.env.splice (e--, 1); /* remove */
		}
		
		if (period) {
                    ch.slide_target = period;
		    if (effect != 3 && effect != 5) {
			ch.period = period; ch.soffset = 0; ch.vibpos = 0;
		    }
		}
		
		if (sm) { /* CHECKME! */
		    if (samp !== ch.sample)
			ch.fillfunc = null;
		    
		    ch.sample = samp;
		    ch.finetune = sm.finetune;
		}
		
		if (o.env) {
		    for (var e=0; e<o.env.length; e++) {
			var env = {
			    num: o.env[e].num,
			    type: o.env[e].type,
			    len: o.env[e].len,
			    off: 0,
			};
			ch.env.push(env);
		    }
		}

		switch (effect) {
		case 11: pl.pos=value; pl.event = -1; break;
		    /* Pattern break.  The effect parameter should set the
		       event number to start at, but we'll only handle the common
		       case where it's zero and the next pattern is played from 
		       the beginning. */
		case 13: pl.event = 63+(value>>4)*10 + (value & 15); break;
		case 15: pl.tempo = value;
		}
	    }
	    }
	    var ev = [];
	    for(var chan=0; chan<mod.nchan; chan++) {
		var ch = pl.chan[chan];
		var sm = mod.sample[1];//ch.sample];
		var penv = 1;
		for (var e=0; e<ch.env.length; e++)
		    if (ch.env[e].type == "penv")
			penv *= Math.exp2(mod.envelope(
					      mod.pitchenv[ch.env[e].num],
					      ch.env[e].off)/12
					 );

		var venv = 1;
		for (var e=0; e<ch.env.length; e++)
		    if (ch.env[e].type == "venv")
			venv *= mod.envelope(
			    mod.volenv[ch.env[e].num],
			    ch.env[e].off
			);
		ch.vol = venv;

		if (sm) {
		    var p = (pl.ntsc?3579545:3546895) * sm.speed / (sm.looptype==2?sm.rlen*2:sm.rlen) * Math.exp2(mod.pitchadj/12) / 8363.422897
			/ 15625 * penv / (mod.note2period((7680-ch.period)/16));

		    ev[chan] = { vol: ch.vol, pitch: 8/p };
		}
	    }
	    outbuf[outptr++] = ev;
	}
    },

    setpos:function (pos) {
	var pl=this;
	var mod=pl.mod;
	pl.tickleft=0;
	pl.event=-1;
	pl.tick=255;
	for (var i=0; i<mod.nchan; i++) {
	    pl.chan[i].vol=0;
	    pl.chan[i].env=[];
	}

	if (pos<0)
	    pos=0;
	else if (pos>=mod.seqlen) return;
	pl.pos=pos;
    },

    init:function () {
	var pl=this;
	var mod=pl.mod;
	pl.tempo = mod.inittempo;
	pl.pattdelay = 0;
	pl.chan={};
	//pl.needed_buf={};
	for (var i=0; i<mod.nchan; i++) {
	    var c={ period:0, sample:0, soffset:0,
		    pan:mod.pan[i], finetune:0,
		    offset_memory:0, slide_memory:0, slide_target:0,
		    looppos:0, loopcount:0,
		    env: [],
		    vibpos:0, vibspeed:0, vibdepth:0,
		    trempos:0, tremspeed:0, tremdepth:0,
		    lastsamp:0, dcoffset:0, enabled:(mod.chan[i]!=undefined?mod.chan[i].enabled:true),
		    resampler: new Resampler(), pcmbuf: new Ringbuf(16384), pcmoff: 0, pcmleft: 0
		  };
	    pl.chan[i] = c;
	}
	pl.tempoadj_count=0;
	pl.setpos(0);
    },
};

