function amiga_load (buf, params) {
    var mod = Object.create(Mod.prototype);
    var file = new Uint8Array(buf);
    var pos = 0;
    function read8 () { return file[pos++]; }
    function read16 () { pos+=2; return file[pos-2]+256*file[pos-1]; }
//    function read32 () { pos+=4; return file[pos-4]+256*(file[pos-3]+256*(file[pos-2]+256*(file[pos-1]))); }
    function read32 () { var b = read16(); b += read16() * 65536; return b; }
    function readstring (ptr, size) {
	var arr = [];
	for (var i=0; i<size; i++)
	    arr[i]=file[ptr+i];
	/* latin-1 */
	return String.fromCharCode.apply(this,arr).replace(/\0.*$/g,'');
    }

    var dump;
    pos = 0;

    dump = true;

    
    var sequence = [];
    mod.title = "";
	
    mod.chan = [];
    mod.pan = [-64,64,64,-64];
    mod.initspeed = 1;
    mod.nchan = 4;
    mod.sample = [];
    mod.npatts = 1;

    for (var i=1; i<=1; i++) {
	var s = mod.sample[i] = {
	    name:"tmp",
	    len:32,
	    speed:8287,
	    vol:64, //* unused *
	    rstart:0,
	    rlen:32,
	    looptype:1,
	    data:new Float32Array(32)
	};
        for (var j=0; j<32; j++) {
	    s.data[j] = j<16 ? 0.5 : 0;
	}
    }
    mod.nsamples = 1;

    mod.seqlen = (params.seqlen && parseInt(params.seqlen,10)) || 16;

    mod.parr = [];
    for (var i=0; i<mod.seqlen; i++)
	sequence[i] = i;
    mod.sequence = sequence;

    function reg_write(pl, voice, reg, val) {
	var regs=pl.chan[voice].regs;
	//log("voice "+voice+" reg="+reg+" val="+val);
	switch (reg) {
	    case 4: /* LCH */
	    case 5: /* LCL */
	    break;
	    case 3: /* LEN */
	    //pl.gate[voice] = true;
	    break;
	}
/*
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
*/
	regs[reg] = val;
    }


    function init(pl) {
	pl.speed = mod.initspeed; pl.tempo = mod.inittempo;
	pl.pattdelay = 0;
	for (var i=0; i<mod.nchan; i++) {
	    var c={ period:0, sample:0, soffset:0,
		    pan:mod.pan[i], finetune:0,
		    lastsamp:0,
		    wave:0,
		    arp:0,
		    regs:new Uint16Array(8),
		    addr:0, len:0,
		    pitch_env:[], vol_env:[]
		  };
	    pl.chan[i] = c;
	}

	pl.gate=[];
	pl.lastevent = null;
	pl.lasttick = 0;
	pl.frame = 0;
	mod.inittempo = 125;
    }

   function relpitch(p1, p2) {
	return (Math.log(p1/p2) / Math.LN2) * 12;
    }

    function pitch2note (pitch) {
	return Math.floor(-Math.log((pitch/1712/4))/Math.LN2*12+.5);
    }
    
    var samphash=[];
    function do_tick(mod, pl, chan, event, tick, log_fix, flush_env) {
	/* event is assumed to increase monotonically */
	if (pl.lastevent != event) {
	    pl.lastevent = event;
	    /* read a new frame */
	    {
		while (pl.lasttick < pl.frame * 70938) {
		    var voice = read8();
		    if (voice===undefined) {
			//log("eof at "+pl.lasttick);
			break;
		    }
		    //log("voice="+voice);
		    if (voice == 0xff) {
			var dmacon = read16();
			log("dmacon="+dmacon.toString(16));
			for (var i=0; i<4; i++) {
			    if (dmacon & (1<<i)) {
				if (!(pl.dmacon & (1<<i))) {
				    //log("gate "+i);
				    pl.gate[i]=true;
				    var ch = pl.chan[i &3];
				    var regs = ch.regs;
				    ch.addr = regs[4]*65536 + regs[5];
				    ch.len = regs[3];
				}
			    }
			}
			pl.dmacon = dmacon;
		    } else if (voice & 0x80) {
			/* DMA */
			var ptr = read32();
			var value = read16();
			var ch = pl.chan[voice &3];
			var regs = ch.regs;
			var len = ch.len;
			var base = ch.addr;
			//log("dma addr="+addr+" val="+val+" base="+base);
			var s;
			var sample;
			if (sample = samphash[base]) {
			    s = mod.sample[sample];
			    if (base !=s.addr ) {
				base = s.addr;
				//log("matched sample "+sample+" base="+base+" addr="+s.addr);
			    }
			} else {
			    sample = samphash[base] = ++mod.nsamples;
			    s = mod.sample[sample] = {
				name:'['+base.toString(16)+".."+(base+len*2).toString(16)+"]",
				len:len*2,
				speed:8287,
				vol:64, /* unused */
				rstart:0,
				rlen:len*2,
				looptype:1,
				addr:base,
				used:0,
				data:new Float32Array(len*2)
			    };
			    for (var i=0; i<s.data.length; i++)
				s.data[i] = .75;
			    //log("new sample, base="+base+" len="+len*2);
			}
			//if (s.used < s.len) {
			if ((ptr-base >= 0 && ptr-base < s.len)) {
			    var off = ptr-base;
			    
			    if (s.data[off]==.75) {
				s.data[off] = ((value >> 8)^128) / 128 - 1;
				s.data[off+1] = ((value & 255)^128) / 128 - 1;
				s.used+=2;
				//log("s="+sample+" used="+s.used+" of "+s.len+" ptr="+ptr+" base="+base);
			    }
			    if (ptr < ch.lastaddr) {
				var base = regs[5]+regs[4]*65536;
				if (ch.regs[3]>1 && 
				    (base-s.addr + ch.regs[3]*2) <= s.len) {
				    s.rstart = base - s.addr;
				    s.rlen = ch.regs[3]*2;//s.len - s.rstart;
				    samphash[s.addr+s.rstart] = sample;
				} else {
				    s.looptype =0;
				    s.rlen = 0;
				    s.rstart = 0;
				}
			    }
			    ch.lastaddr = ptr;
			} else {
			    //log("out of range: ptr="+ptr+" base="+base+" len="+s.len);
			}
		    } else {
			var cycles = read32();
			pl.lasttick = cycles;
			var reg = read8();
			var val = read16();
			reg_write(pl, voice, reg, val);
		    }
		}
	    }
	    pl.frame++;
	}

	var ch = pl.chan[chan];
	var newev={};
	ch.penv = []; ch.venv = [];

	var regs = ch.regs;
	var pitch = regs[1]; /* PER */
	//var len = regs[3]; /* LEN */
	if (ch.event_period)
	    ch.period = pitch;
	var base = ch.addr;
	var sample = samphash[base] || 1;

	if (pl.gate[chan]) {
		//flush_env ("venv", "vol", ch, mod, pl);
	}

	if (pl.gate[chan]) {
	    pl.gate[chan] = false;
	    newev.samp = ch.sample = sample;
	    flush_env ("venv", "env", ch, mod, pl);
	    ch.period = ch.event_period = pitch;
	    newev.note = pitch2note(pitch);
	    flush_env ("penv", "pitch", ch, mod, pl);	    
	}

	ch.venv.vol = regs[0]/64;
	if (ch.venv.vol > 1)
	    ch.venv.vol = 1;
//	if (!sample)
//	    ch.venv.vol = 0;
	if (!pl.dmacon & (1<<chan))
	    ch.venv.dma = 0;

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
log("nsamples="+mod.nsamples);
    return mod;
}
