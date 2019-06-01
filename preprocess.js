if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

var object_equals = function(x1,x2)
{
  for(p in x1) {
      if(typeof(x2[p])=='undefined') {return false;}
  }

  for(p in x1) {
      if (x1[p]) {
          switch(typeof(x1[p])) {
              case 'object':
                  if (!object_equals(x1[p], x2[p])) { return false; } break;
              case 'function':
                  if (typeof(x2[p])=='undefined' ||
                      (p != 'equals' && x1[p].toString() != x2[p].toString()))
                      return false;
                  break;
              default:
                  if (x1[p] != x2[p]) { return false; }
          }
      } else {
          if (x2[p])
              return false;
      }
  }

  for(p in x2) {
      if(typeof(x1[p])=='undefined') {return false;}
  }

  return true;
}



/*
 * This works as follows.  The caller may use any pitch system it
 * likes. thus ch.period is semi-private to the caller.  Caller
 * provides the following callbacks:
 * 
 * relpitch(actual_period, reference_period): returns the interval
 * between two periods, in semitones (100 cents).
 *
 * init(): set up chan array etc.
 * 
 * do_tick(): return event information object for current tick.
 * If null, no event is generated.
 */

function preprocess(mod, foo) {

    var fixups={};
    function log_fix(type) {
	if (!fixups[type])
	    fixups[type]=0;
	
	fixups[type]++;
    }

    var env_hash = { venv:{}, penv:{} }; /* for de-duplication */

    function flush_env(type, name, ch, mod, pl) {
	//log("flush_env: ev="+pl.event+" name="+name);
	switch (type) {
	    case "venv":
	    finish_env (ch.vol_env[name], out, mod.volenv, "venv");
	    delete ch.vol_env[name];
	    break;
	    case "penv":
	    finish_env (ch.pitch_env[name], out, mod.pitchenv, "penv");
	    delete ch.pitch_env[name];
	    break;
	}
    }

    function flush_envs (pl, mod) {
	for (var chan=0; chan<mod.nchan; chan++) {
	    var ch = pl.chan[chan];
	    for (var i in ch.pitch_env) {
		flush_env("penv", i, ch, mod, pl);
		delete ch.pitch_env[i];
	    }
	    for (var i in ch.vol_env) {
		flush_env("venv", i, ch, mod, pl);
		delete ch.vol_env[i];
	    }
	}
    }

    function finish_env(env_obj, patt, arr, type) {
	if (!env_obj)
	    return;

	var e = env_obj.env;
	var patt_ptr = env_obj.patt_ptr;

	if (!e || !e.length)
	    return;

	/* compress */
	var env=[];

	var last=undefined;
	var s="";
	for (var j=0; j<e.length; j++) {
	    if (!isFinite(e[j]))
		log (j+"="+e[j]+" "+type);
	    if (e[j] != last) {
		env.push({off:j, val:e[j]});
		last = e[j];
		s+=j+","+e[j]+" ";
	    }
	}

	if (env.length == 1 && env[0].off == 0 && env[0].value == 0
	    && type == "penv")
	    return;

	if (env.length == 1 && env[0].off == 0 && env[0].value == 1
	    && type == "venv")
	    return;

	env.used = e.length;
	s += env.used;

	/* locate this env if it exists already */
	var envnum;
	if (env_hash[type][s]) {
	    envnum = env_hash[type][s];
	} else {
	    /* There are four possibilities here: (1) e1 and e2 are
	     * identical; (2) e1 is a prefix of e2; (3) e2 is a prefix of
	     * e1; (4) none of the above.
	     */
	    function compare_env_prefix(e1,e2) {
		for (var j=0;; j++) {
		    if (!e1[j]) {
			if (!e2[j])
			    return 1;
			if (e1.used <= e2[j].off)
			    return 2;
			return 4;
		    }
		    if (!e2[j]) {
			if (e2.used <= e1[j].off)
			    return 3;
			return 4;
		    }
		    if (e1[j].off != e2[j].off ||
			e1[j].val != e2[j].val)
			return 4;
		}
		/* notreached */
	    }

	    envnum = undefined;
	    for (var i=1; !envnum && i<arr.length; i++) {
		var c=compare_env_prefix(env, arr[i]);
 		var e1=env, e2=arr[i];
		//var str='';for (var q=0;q<e1.length;q++) str+="["+e1[q].off+","+e1[q].val+"] ";
		//var str2='';for (var q=0;q<e2.length;q++) str2+="["+e2[q].off+","+e2[q].val+"] ";
		//if (c!=4) log ("c: "+c+" i="+i+" e1 ("+e1.length+" used="+e1.used+"): "+str+" e2 ("+e2.length+"used="+e2.used+"): "+str2);
		switch (c) {
		case 3: /* swap 'em */
		    arr[i] = env;
		    /* fall-through */
		case 2:
		    envnum = i;
		    break;
		case 1:
		    /* an existing env exists, but is too short: extend it */
		    envnum = i;
		    break;
		}
	    }
	}

	if (!envnum) {
	    envnum = arr.length;
	    arr[envnum] = env;
	}
	env_hash[type][s] = envnum;
	if (env.used > arr[envnum].used)
	    arr[envnum].used = env.used;

	if (1) {
	    for (var i=0; i<env.used; i++) {
		var a1=mod.envelope(env,i);
		var a2=mod.envelope(arr[envnum], i);
				    
		if (a1 !== a2) {
		    alert ("FAIL: "+a1+" "+a2);
		    var e1=env; var e2=arr[envnum];
		    log ("envnum="+envnum+ " e1.used = "+e1.used+" e2.used="+e2.used)
		    break;
		}
	    }
	}


//	if (type == "venv") log(envnum+" pattptr="+patt_ptr+" "+s);

	if (!patt[patt_ptr])
	    patt[patt_ptr] = {};

	if (!patt[patt_ptr].env)
	    patt[patt_ptr].env = [];

	//log ("env "+type+" num "+envnum+" len "+e.length);
	patt[patt_ptr].env.push({ type: type, num: envnum, len: e.length });
    }

    mod.parr = [];
    mod.newseq = [];
    mod.pitchenv = [[]];
    mod.volenv = [[]];
    var posdone = [];
    var newpos = 0; 
    var posmap = {};

    /* playback state */
    var pl = {
	mod: mod,
	speed: mod.initspeed,
	event: 0, pos: 0,
	tick: 0, chan: [],
	pattdelay:0,
	nextpos: null, nextevent: null,
    };
    
    if (foo.init)
	foo.init(pl);

    pl.speed = mod.initspeed;
    pl.event = 0;
    for (; pl.pos < mod.seqlen; ) {
	var out=[], outptr = 0;
	for (var i=0; i<mod.nchan; i++) {
//	    pl.chan[i]=mod.chan[i];
	    pl.chan[i].pattsamp = null;
	}

	var pattlen;
	if (foo.getpattlen)
	    pattlen = foo.getpattlen(pl);
	else
	    pattlen = 64;

	for (; pl.event < pattlen; pl.nextevent!==null ? pl.event = pl.nextevent : pl.event++) {
	    pl.nextevent = null, pl.nextpos = null;
	    pl.pattdelay = 0;
	    for (pl.tick=0; pl.tick<pl.speed*(pl.pattdelay+1); pl.tick++) {
		for (chan=0; chan<mod.nchan; chan++) {
		    var ch = pl.chan[chan];

		    var newev = foo.do_tick(mod, pl, chan, pl.event, pl.tick, log_fix, flush_env);
		    if (!newev)
			break;
		    
		    /* existing envs */
		    for (var i in ch.pitch_env) {
			if (!(i in ch.penv)) {
			    /* this env is finished */
			    flush_env("penv", i, ch, mod, pl);
			    delete ch.pitch_env[i];
			}
		    }

		    for (var i in ch.vol_env) {
			if (!(i in ch.venv)) {
			    /* this env is finished */
			    flush_env("venv", i, ch, mod, pl);
			    delete ch.vol_env[i];
			}
		    }

		    /* possibly-new envs */
		    for (var i in ch.penv) {
			if (!(i in ch.pitch_env))
			    ch.pitch_env[i] = { env: [], patt_ptr: outptr };

//			if (!isFinite(ch.penv[i]))
//			    alert("penv '"+i+"' is "+ch.penv[i]);
			ch.pitch_env[i].env.push (ch.penv[i]);
		    }

		    for (var i in ch.venv) {
			if (!(i in ch.vol_env))
			    ch.vol_env[i] = { env: [], patt_ptr: outptr };

//			if (!isFinite(ch.venv[i]))
//			    alert("venv '"+i+"' is "+ch.venv[i]);
			ch.vol_env[i].env.push (ch.venv[i]);
		    }

	    
		    mod.packevent(out, outptr, newev);
		    outptr += mod.eventsize;
		}
	    }
	    
	    if (pl.nextpos !== null)
		break;

	    if (out.length > 500000) {
		alert ("infinite_length?");
		break;
	    }
	}

	var p = out;

	/* fixup pointers for existing envelopes */
	flush_envs (pl, mod);

	/* true for identical, false otherwise */
	function arraycmp(a1, a2) {
	    if (!a1 && !a2)
		return true;
	    if (!a1 || !a2)
		return false;
	    if (a1.length != a2.length)
		return false;
	    for (var j=0; j<a1.length; j++) {
		if (!a1[j] && !a2[j])
		    continue;
		if (!a1[j] || !a2[j])
		    return false;
		if (!object_equals(a1[j],a2[j]))
		    return false;
	    }
	    return true;
	}
	    
	mod.newseq[newpos] = mod.sequence[pl.pos];
	var pp = mod.parr[mod.newseq[newpos]];
	
	if (pp) {
	    if (!arraycmp(p,pp)) {
		log_fix ("inconsistent_patt");
		mod.npatts++;
		mod.newseq[newpos] = mod.npatts;
		if (mod.npatts > 300) {
		    alert ("infinite_patts?");
		    break;
		}
	    } else {
		if (posdone[pl.pos])
		    break;
	    }
	}

	posdone[pl.pos]=1;
	posmap[pl.pos] = newpos;
	mod.parr[mod.newseq[newpos]] = p;

	if (pl.nextevent !== null)
	    pl.event = pl.nextevent;
	else
	    pl.event = 0;
	if (pl.nextpos !== null)
	    pl.pos = pl.nextpos;
	else
	    pl.pos++;
	newpos++;
    }
    if (pl.pos < mod.seqlen)
	mod.restartpos = posmap[pl.pos];

    /* finish up outstanding envelopes */
    flush_envs (pl, mod);

    /* true for identical, false otherwise */
    function envcmp(e1,e2) {
	if (!e1 && !e2)
	    return true;
	if (!e1 || !e2)
	    return false;
	if (e1.length != e2.length)
	    return false;
	for (var j=0; j<e1.length; j++)
	    if (e1[j].off != e2[j].off || e1[j].val != e2[j].val)
		return false;
	    return true;
    }

   log ("pitchenvs: "+mod.pitchenv.length + "volenvs: "+mod.volenv.length);

    mod.sequence = mod.newseq;
    mod.seqlen = newpos;
    mod.initspeed = 1;
    {
	var str="";
	$.each(fixups,function(k,v) {
		   str+=" "+k+": "+v;
	       });
	if (str) log("Fixups: "+str);
    }

    return mod;
}
