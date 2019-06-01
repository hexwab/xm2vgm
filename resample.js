var Ringbuf = function (size) {
    if (size & (size-1))
	return null; /* gotta be a power of two */
    this.data = new Float32Array(size);
    this.mask = size-1;
    this.length = size;
}

Ringbuf.prototype = {
	/* fill helper: returns new offset.
	 * callback(array, offset, len) returns nothing */
	fill: function(fillfunc, ptr, len, extra) {
	    if (!len)
		return ptr;

	    if (len > this.length)
		alert ("fill: oversized request ("+len+ ", bufsize "+this.length+")");

	    if (ptr+len < this.length) {
		fillfunc(this.data, ptr, len, extra);
		return ptr+len;
	    } else {
		var part1 = this.length-ptr;
		var part2 = len - part1;
		if (part1)
		    fillfunc(this.data, ptr, part1, extra);
		if (part2)
		    fillfunc(this.data, 0, part2, extra);
		return part2;
	    }
	}	    
};

var Resampler = function(size) {
    if (!size)
	size = 16384;
    this.inbuf = new Ringbuf(size);
    this.readptr = 0;
    this.writeptr = 0;
};

Resampler.prototype = {
    resample: function(infunc, ratio, outbuf, offset, len) {
	if (!len) {
	    alert("!len");
	    len = outbuf.length;
	    offset = 0;
	}
	var paranoid = true;
	
	var skip = 1;
	var fill;
	if (ratio > 2 && infunc.skip) {
	    skip = Math.floor(ratio);
	    ratio /= skip;
	    fill = infunc.skip;
	    //log ("skip="+skip+" ratio="+ratio);
	} else {
	    fill = infunc.fill;
	}

	var needed = len * ratio + 3; /* 1 is latency */
	//log("ratio="+ratio+" outbufsize "+outbuf.length+" needed "+needed+" readptr "+this.readptr+" writeptr "+this.writeptr);
	
	if (needed > this.inbuf.length) {
	    //log("ratio="+ratio+" outbufsize "+outbuf.length+" needed "+needed+" readptr "+this.readptr+" writeptr "+this.writeptr);
	    log ("needed "+needed+" buflen "+this.inbuf.length+" ratio="+ratio);
	    return;
	}
	var fillsize = Math.ceil(this.readptr + needed) - this.writeptr;

	/* writeptr is logically ahead of readptr; compensate if the
	 *  buffer boundary lies between them */
	if (this.writeptr < this.readptr)
	    fillsize -= this.inbuf.length;

	if (paranoid) {
	    var oldptr = this.writeptr;
	    for (var i=0; i<fillsize+1; i++)
		this.inbuf.data[(oldptr+i) & this.inbuf.mask] = undefined;
	}
	this.writeptr = this.inbuf.fill(fill, this.writeptr, fillsize, skip);
	if (paranoid) {
	    var count = 0;
	    for (var i=0; i<fillsize; i++) {
		if (!isFinite(this.inbuf.data[(oldptr+i) & this.inbuf.mask]))
		    count++;
	    }
	    if (count) {
		throw new Error("resample: fill wrote invalid data ("+count+" of "+fillsize+")");
		return;
	    }
	}

	var d = this.inbuf.data, m = this.inbuf.mask;
	var ptr = this.readptr;
	for (var i=0; i<len; i++) {
	    ptr += ratio;
	    //if (!isFinite(d[(ptr+1) & m]))
	    //  log("f00: "+this.readptr+" "+d[(ptr+1) & m]);
	    ///* linear */
	    //var frac = ptr - Math.floor(ptr);
	    //outbuf[offset+i] = d[ptr & m] * (1-frac);
	    //if (frac)
	    //	outbuf[offset+i] += d[(ptr+1) & m] * frac;

	    /* cubic */
	    var frac = ptr - Math.floor(ptr);
	    var y0 = d[ptr & m],
	        y1 = d[(ptr+1) & m],
	        y2 = d[(ptr+2) & m],
	        y3 = d[(ptr+3) & m];
	    var a0, a1, a2, a3;
            a0 = y3 - y2 - y0 + y1;
            a1 = y0 - y1 - a0;
            a2 = y2 - y0;
            a3 = y1;
	    outbuf[offset+i] = (((a0 * frac + a1) * frac + a2) * frac + a3);
	}

	while (ptr >= this.inbuf.length)
	    ptr -= this.inbuf.length;

	this.readptr = ptr;
    }
}
