var fn = process.argv[2];
if (!fn) throw "need filename";

var p = process.argv.splice(3);
var params={};
p.map(function (el) {
	  var keyval = el.split('=');
	  var key=keyval.shift();
	  var val=keyval.join('='); /* sigh */
	  if (key)
	      params[key]=val;
      }
     );

var fs = require('fs');

function ev(file) {
    eval.apply(this,[fs.readFileSync(file,{encoding:'utf8'})+'']);
}

['h3.js','export2.js','resample.js','preprocess.js','protracker.js',
 's3m.js','xm.js','sid.js','cpu6502.js','gbs.js','gbsplay.js', 'vgm.js',
 'amiga.js', 'mt.js'].map(ev,this);

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}


var buf=fs.readFileSync(fn);
var mod=new Mod(toArrayBuffer(buf),params);
//var fadeoff = parseInt(params.fadeoff) || Infinity;
//var thresh = parseInt(params.thresh) || 1;
var voladj = parseInt(params.voladj) || 0;
init_tuning(48000);
var pl = new Player(mod);
pl.init();
var buf = pl.play();
//log(buf);
var outbuf=[], outptr=0;
log("duration: "+(buf.length*256/15625)+" ("+buf.length+" events)");
function put() {
    for (let a of arguments) {
	outbuf[outptr++] = a;
    }
}

function pack() {
    for (let a of arguments) {
	put(a&255);
	put((a>>8) &255);
	put((a>>16) &255);
	put((a>>24) &255);
    }
}
var maxv=0;
function getvol(v) {
    //return (15-v*16)&15;
    console.assert(v<=1);
    var i=0;
    return v?Math.log(v)/Math.log(10)*-10:20;
    /*
    for (var i=0; v<1 && i<20; i++, v*=1.58489319246111348521);
    return i;
    */
    /*
    for (let i=0;i<16;i++) {
	if (v*64>=([64,51,40,32,25,20,16,13,10,8,6,5,4,3,2,0]
		[i]))
	    return i;
    }
    */
}

var lastnoise = NaN, noisechanged = true;
for (let ev of buf) {
    var i=0;
    for (let i=0;i<4; i++) {
	var ch=ev[i];
	log(ch);
	var vol = getvol(ch.vol);
	log(`ch=${i} volin=${ch.vol} volout=${vol}`);

	if (ch.vol) {
	    var pitch = ch.pitch & 4095;
	    if (i==3) {
		var p = (Math.log(ch.pitch)/Math.log(2)-7)|0;
		if (p != lastnoise || noisechanged) {
		    put (0x50, i*0x20+0x84+[0,0,1][(p&3)]);
		    lastnoise = p;
		    noisechanged = false;
		}
		//log(`p=${ch.pitch} pitch=${p}`);
	    } else {	
		if (pitch > 1023) {
		    pitch >>= 2;
		    put (0x50, i*0x20+0x80+(pitch&15));
		    put (0x50, ((pitch>>4)&0x3f)+0x40);
		    vol -= 3;
		} else {
		    put (0x50, i*0x20+0x80+(pitch&15));
		    put (0x50, (pitch>>4)&0x3f);
		}
	    }
	} else {
	    if (i==3) {
		noisechanged = true;
	    }
	}
	
	vol += voladj; // global adj
	if (vol<0) vol=0;
	if (vol>15) vol=15;
	put (0x50, i*0x20+0x90+(vol|0));
	//log ((i*0x20+0x90+vol).toString(16));
    }
    put (0x63);
}
put(0x66);
var tmpbuf =outbuf;
outbuf=[], outptr=0;
var eofoff = tmpbuf.length+60, clock = 4000000, nsamp = buf.length * 882, loopoff = 0, loopsamp = 0;
    
pack(0x206d6756, eofoff, 0x150, clock,
    0, 0, nsamp, loopoff, 
    loopsamp, 50, 0x000f0003, 0,
     0, 12, 0, 0);
log(`len=${outbuf.length} maxvol=${maxv}`);
process.stdout.write(new Buffer(outbuf));
process.stdout.write(new Buffer(tmpbuf));
