/*
	6502 JavaScript emulator
	by N. Landsteiner  2005, e-tradion.net
	
	derived from the c source by
	
    Earle F. Philhower III, Commodore 64 Emulator v0.3, (C) 1993-4
    
    extended for exact cycle times [N. Landsteiner, 2005]

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    For the GNU General Public License see the Free Software Foundation,
    Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
    
    Thanks to "chip" for a bugfix in function BranchRelAddr().
    
    fixed a bug regarding byte ranges in functions opDECR and opINCR -
    thanks to James Larson for reporting. (2008-09-05)
    
*/

// constants

var CPU6502 = function (cb) {
    var fCAR = 1;
    var fZER = 2;
    var fINT = 4;
    var fDEC = 8;
    var fBKC = 16;
    var fOVF = 64;
    var fNEG = 128;

    // regs & memory

    var a, x, y, flags, sp, pc;
    var RAM=new Uint8Array(65536);
    var hash=0;
    var breakFlag=false;

    function Write(addr, val) {
	if ((addr & 0xf000) == 0xd000)
	    cb(addr & 0xfff, val);
	else {
	    var xor=val^RAM[addr];
	    RAM[addr]=val;
//	    log("wrote "+addr+" val "+val);
	    var rot=(addr*11)&31;
	    hash^=(xor>>>rot)|(xor<<(32-rot));
	}
    }
    function ByteAt(addr) {
//	print("addr "+addr);
	return RAM[addr];
    }
    function WordAt(addr) {
	return ByteAt(addr)+ByteAt(0xffff&(addr+1))*256;
    }
    function ImmediateByte() {
	return ByteAt(pc);
    }
    function ZeroPageAddr() {
	return ByteAt(pc);
    }
    function ZeroPageXAddr() {
	return 255&(x+ByteAt(pc));
    }
    function ZeroPageYAddr() {
	return 255&(y+ByteAt(pc));
    }
    function IndirectXAddr() {
	return WordAt(255&(ByteAt(pc)+x));
    }
    function IndirectYAddr() {
	return (WordAt(ByteAt(pc))+y)&0xffff;
    }
    function AbsoluteAddr() {
	return WordAt(pc);
    }
    function AbsoluteXAddr() {
	return (WordAt(pc)+x)&0xffff;
    }
    function AbsoluteYAddr() {
	return (WordAt(pc)+y)&0xffff;
    }
    function BranchRelAddr() {
	var addr=ImmediateByte();
	pc++;
	addr= (addr&128)? pc-((addr^255)+1) : pc+addr;
	pc=addr&0xffff;
    }

    // stack

    function stPush(z) {
	Write(sp+256,z&255);
	sp--;
	sp&=255;
    }
    function stPop() {
	sp++;
	sp&=255;
	return ByteAt(sp+256);
    }
    function stPushWord(z) {
	stPush((z>>8)&255);
	stPush(z&255);
    }
    function stPopWord() {
	var z=stPop();
	z +=256*stPop();
	return z;
    }

    // operations

    function FlagsNZ(z) {
	flags &=~(fZER+fNEG);
	if (z==0) {
	    flags|=fZER;
	}
	else {
	    flags |=z&128;
	}
    }
    function opORA(x) {
	a|=ByteAt(x());
	FlagsNZ(a);
    }
    function opASL(x) {
	var addr = x();
	var tbyte = ByteAt(addr);
	flags &=~(fCAR+fNEG+fZER);
	if (tbyte&128) flags |= fCAR;
	if (tbyte=tbyte<<1) {
	    flags |=tbyte&128;
	}
	else {
	    flags |=fZER;
	}
	Write(addr, tbyte);
    }
    function opLSR(x) {
	var addr=x();
	var tbyte=ByteAt(addr);
	flags &=~(fCAR+fNEG+fZER);
	flags |=tbyte&1;
	if (tbyte=tbyte>>1) {}
	else {
	    flags |=fZER;
	}
	Write(addr, tbyte);
    }
    function opBCL(x) {
	if (flags&x) {
	    pc++;
	}
	else {
	    BranchRelAddr();
	}
    }
    function opBST(x) {
	if (flags&x) {
	    BranchRelAddr();
	}
	else {
	    pc++;
	}
    }
    function opCLR(x) {
	flags &=~x;
    }
    function opSET(x) {
	flags |= x;
    }
    function opAND(x) {
	a &= ByteAt(x());
	FlagsNZ(a);
    }
    function opBIT(x) {
	var tbyte=ByteAt(x());
	flags &=~(fZER+fNEG+fOVF);
	if ((a&tbyte)==0) flags |=fZER;
	flags |=tbyte&(128+64);
    }
    function opROL(x) {
	var addr=x();
	var tbyte=ByteAt(addr);
	if (flags&fCAR) {
	    if (tbyte&128) {}
	    else {
		flags &=~fCAR;
	    }
	    tbyte=(tbyte<<1)|1;
	}
	else {
	    if (tbyte&128) flags|=fCAR;
	    tbyte=tbyte<<1;
	}
	FlagsNZ(tbyte);
	Write(addr, tbyte);
    }
    function opEOR(x) {
	a^=ByteAt(x());
	FlagsNZ(a);
    }
    function opADC(x) {
	var data=ByteAt(x());
	if (flags&fDEC) {
	    data = bcd2dec[data]+bcd2dec[a]+((flags&fCAR)?1:0);
	    flags &= ~(fCAR+fOVF+fNEG+fZER);
	    if (data>99) {
		flags|=fCAR+fOVF;
		data -=100;
	    }
	    if (data==0) {
		flags|=fZER;
	    }
	    else {
		flags |=data&128;
	    }
	    a=dec2bcd[data];
	}
	else {
	    data += a+((flags&fCAR)?1:0);
	    flags &= ~(fCAR+fOVF+fNEG+fZER);
	    if (data>255) {
		flags|=fOVF+fCAR;
		data &=255;
	    }
	    if (data==0) {
		flags|=fZER;
	    }
	    else {
		flags |=data&128;
	    }
	    a=data;
	}
    }
    function opROR(x) {
	var addr=x();
	var tbyte=ByteAt(addr);
	if (flags&fCAR){
	    if (tbyte&1) {}
	    else flags&=~fCAR;
	    tbyte=(tbyte>>1)|128;
	}
	else{
	    if (tbyte&1) flags|=fCAR;
	    tbyte=tbyte>>1;
	};
	FlagsNZ(tbyte);
	Write(addr, tbyte);
    }
    function opSTA(x) {
	Write(x(), a);
    }
    function opSTY(x) {
	Write(x(), y);
    }
    function opSTX(y) {
	Write(y(), x);
    }
    function opCPY(x) {
	var tbyte=ByteAt(x());
	flags &=~(fCAR+fZER+fNEG);
	if (y==tbyte) {
	    flags |=fCAR+fZER;
	}
	else if (y>tbyte) {
	    flags |=fCAR;
	}
	else {
	    flags |=fNEG;
	}
    }
    function opCPX(y) {
	var tbyte=ByteAt(y());
	flags &=~(fCAR+fZER+fNEG);
	if (x==tbyte) {
	    flags |=fCAR+fZER;
	}
	else if (x>tbyte) {
	    flags |=fCAR;
	}
	else {
	    flags |=fNEG;
	}
    }
    function opCMP(x) {
	var tbyte=ByteAt(x());
	flags &=~(fCAR+fZER+fNEG);
	if (a==tbyte) {
	    flags |=fCAR+fZER;
	}
	else if (a>tbyte) {
	    flags |=fCAR;
	}
	else {
	    flags |=fNEG;
	}
    }
    function opSBC(x) {
	var data=ByteAt(x());
	if (flags&fDEC) {
	    data = bcd2dec[a]-bcd2dec[data]-((flags&fCAR)?0:1);
	    flags &= ~(fCAR+fZER+fNEG+fOVF);
	    if (data==0) {
		flags |=fZER+fCAR;
	    }
	    else if (data>0) {
		flags |=fCAR;
	    }
	    else {
		flags|=fNEG;
		data +=100;
	    }
	    a=dec2bcd[data];
	}
	else {
	    data = a-data-((flags&fCAR)?0:1);
	    flags &=~(fCAR+fZER+fOVF+fNEG);
	    if (data==0) {
		flags |=fZER+fCAR;
	    }
	    else if (data>0) {
		flags |=fCAR;
	    }
	    else {
		flags|=fOVF;
	    }
	    flags |=data&128;
	    a=data&255;
	}
    }
    function opDECR(x) {
	var addr=x();
	var tbyte=(ByteAt(addr)-1)&255;
	flags &=~(fZER+fNEG);
	if (tbyte) {
	    flags |=tbyte&128;
	}
	else {
	    flags|=fZER;
	}
	Write(addr, tbyte);
    }
    function opINCR(x) {
	var addr=x();
	var tbyte=(ByteAt(addr)+1)&255;
	flags &=~(fZER+fNEG);
	if (tbyte) {
	    flags |=tbyte&128;
	}
	else {
	    flags|=fZER;
	}
	Write(addr, tbyte);
    }
    function opLDA(x) {
	a=ByteAt(x());
	FlagsNZ(a);
    }
    function opLDY(x) {
	y=ByteAt(x());
	FlagsNZ(y);
    }
    function opLDX(y) {
	x=ByteAt(y());
	FlagsNZ(x);
    }

    // instructions

    function i00() {
	flags |= fBKC;
	stPushWord(pc);
	stPush(flags);
	flags |= fINT;
	breakFlag=true;
    }
    function i01() { opORA(IndirectXAddr); pc++; }
    function i04() { pc++; }
    function i05() { opORA(ZeroPageAddr); pc++; }
    function i06() { opASL(ZeroPageAddr); pc++; }
    function i08() { stPush(flags); }
    function i09() { a |= ImmediateByte(); FlagsNZ(a); pc++; }
    function i0a() {
	if (a&128) {
	    flags |= fCAR;
	}
	else {
	    flags &= ~fCAR;
	}
	a=a<<1;
	FlagsNZ(a);
	a&=255;
    }
    function i0c() { pc+=2; }
    function i0d() { opORA(AbsoluteAddr); pc+=2; }
    function i0e() { opASL(AbsoluteAddr); pc+=2; }
    function i10() { opBCL(fNEG); }
    function i11() { opORA(IndirectYAddr); pc++; }
    function i15() { opORA(ZeroPageXAddr); pc++; }
    function i16() { opASL(ZeroPageXAddr); pc++; }
    function i18() { opCLR(fCAR); }
    function i19() { opORA(AbsoluteYAddr); pc+=2; }
    function i1d() { opORA(AbsoluteXAddr); pc+=2; }
    function i1e() { opASL(AbsoluteXAddr); pc+=2; }
    function i20() { stPushWord((pc+1)&0xffff); pc=WordAt(pc); }
    function i21() { opAND(IndirectXAddr); pc++; }
    function i24() { opBIT(ZeroPageAddr); pc++; }
    function i25() { opAND(ZeroPageAddr); pc++; }
    function i26() { opROL(ZeroPageAddr); pc++; }
    function i28() { flags = stPop(); }
    function i29() { a &= ImmediateByte(); FlagsNZ(a); pc++; }
    function i2a() {
	if (flags&fCAR) {
	    if ((a&128)==0) flags &=~fCAR;
	    a=(a<<1)|1;
	}
	else {
	    if(a&128) flags|=fCAR;
	    a=a<<1;
	};
	FlagsNZ(a);
	a&=255;
    }
    function i2c() { opBIT(AbsoluteAddr); pc+=2; }
    function i2d() { opAND(AbsoluteAddr); pc+=2; }
    function i2e() { opROL(AbsoluteAddr); pc+=2; }
    function i30() { opBST(fNEG); }
    function i31() { opAND(IndirectYAddr); pc++; }
    function i35() { opAND(ZeroPageXAddr); pc++; }
    function i36() { opROL(ZeroPageXAddr); pc++; }
    function i38() { opSET(fCAR); }
    function i39() { opAND(AbsoluteYAddr); pc+=2; }
    function i3d() { opAND(AbsoluteXAddr); pc+=2; }
    function i3e() { opROL(AbsoluteXAddr); pc+=2; }
    function i40() { flags=stPop(); pc=stPopWord(); }
    function i41() { opEOR(IndirectXAddr); pc++; }
    function i45() { opEOR(ZeroPageAddr); pc++; }
    function i46() { opLSR(ZeroPageAddr); pc++; }
    function i48() { stPush(a); }
    function i49() { a ^= ImmediateByte(); FlagsNZ(a); pc++; }
    function i4a() { 
	flags &=~(fCAR+fNEG+fZER);
	if (a&1) flags |=fCAR;
	if (a=a>>1) {}
	else {
	    flags |=fZER;
	}
	a&=255;
    }
    function i4c() { pc=WordAt(pc); }
    function i4d() { opEOR(AbsoluteAddr); pc+=2; }
    function i4e() { opLSR(AbsoluteAddr); pc+=2; }
    function i50() { opBCL(fOVF); }
    function i51() { opEOR(IndirectYAddr); pc++; }
    function i55() { opEOR(ZeroPageXAddr); pc++; }
    function i56() { opLSR(ZeroPageXAddr); pc++; }
    function i58() { opCLR(fINT); }
    function i59() { opEOR(AbsoluteYAddr); pc+=2; }
    function i5d() { opEOR(AbsoluteXAddr); pc+=2; }
    function i5e() { opLSR(AbsoluteXAddr); pc+=2; }
    function i60() { pc=stPopWord(); pc++; }
    function i61() { opADC(IndirectXAddr); pc++; }
    function i65() { opADC(ZeroPageAddr); pc++; }
    function i66() { opROR(ZeroPageAddr); pc++; }
    function i68() { a=stPop(); FlagsNZ(a); }
    function i69() {
	var data=ImmediateByte();
	data += a+((flags&fCAR)?1:0);
	flags &= ~(fCAR+fOVF+fNEG+fZER);
	if (data>255) {
	    flags|=fOVF+fCAR;
	    data &=255;
	}
	if (data==0) {
	    flags |= fZER;
	}
	else {
	    flags |= data&128;
	}
	a=data;
	pc++;
    }
    function i6a() {
	if (flags&fCAR) {
	    if ((a&1)==0) flags &=~fCAR;
	    a=(a>>1)|128;
	}
	else {
	    if(a&1) flags|=fCAR;
	    a=a>>1;
	}
	FlagsNZ(a);
	a&=255;
    }
    function i6c() {
	var ta=WordAt(pc);
	pc=WordAt(ta);
    }
    function i6d() { opADC(AbsoluteAddr); pc+=2; }
    function i6e() { opROR(AbsoluteAddr); pc+=2; }
    function i70() { opBST(fOVF); }
    function i71() { opADC(IndirectYAddr); pc++; }
    function i75() { opADC(ZeroPageXAddr); pc++; }
    function i76() { opROR(ZeroPageXAddr); pc++; }
    function i78() { opSET(fINT); }
    function i79() { opADC(AbsoluteYAddr); pc+=2; }
    function i7d() { opADC(AbsoluteXAddr); pc+=2; }
    function i7e() { opROR(AbsoluteXAddr); pc+=2; }
    function i81() { opSTA(IndirectXAddr); pc++; }
    function i84() { opSTY(ZeroPageAddr); pc++; }
    function i85() { opSTA(ZeroPageAddr); pc++; }
    function i86() { opSTX(ZeroPageAddr); pc++; }
    function i88() { y--; y&=255; FlagsNZ(y); }
    function i8a() { a=x; FlagsNZ(a); }
    function i8c() { opSTY(AbsoluteAddr); pc+=2; }
    function i8d() { opSTA(AbsoluteAddr); pc+=2; }
    function i8e() { opSTX(AbsoluteAddr); pc+=2; }
    function i90() { opBCL(fCAR); }
    function i91() { opSTA(IndirectYAddr); pc++; }
    function i94() { opSTY(ZeroPageXAddr); pc++; }
    function i95() { opSTA(ZeroPageXAddr); pc++; }
    function i96() { opSTX(ZeroPageYAddr); pc++; }
    function i98() { a=y; FlagsNZ(a); }
    function i99() { opSTA(AbsoluteYAddr); pc+=2; }
    function i9a() { sp=x; }
    function i9d() { opSTA(AbsoluteXAddr); pc+=2; }
    function ia0() { y=ImmediateByte(); FlagsNZ(y); pc++; }
    function ia1() { opLDA(IndirectXAddr); pc++; }
    function ia2() { x=ImmediateByte(); FlagsNZ(x); pc++; }
    function ia4() { opLDY(ZeroPageAddr); pc++; }
    function ia5() { opLDA(ZeroPageAddr); pc++; }
    function ia6() { opLDX(ZeroPageAddr); pc++; }
    function ia8() { y=a; FlagsNZ(y); }
    function ia9() { a=ImmediateByte(); FlagsNZ(a); pc++; }
    function iaa() { x=a; FlagsNZ(x); }
    function iac() { opLDY(AbsoluteAddr); pc+=2; }
    function iad() { opLDA(AbsoluteAddr); pc+=2; }
    function iae() { opLDX(AbsoluteAddr); pc+=2; }
    function ib0() { opBST(fCAR); }
    function ib1() { opLDA(IndirectYAddr); pc++; }
    function ib4() { opLDY(ZeroPageXAddr); pc++; }
    function ib5() { opLDA(ZeroPageXAddr); pc++; }
    function ib6() { opLDX(ZeroPageYAddr); pc++; }
    function ib8() { opCLR(fOVF); }
    function ib9() { opLDA(AbsoluteYAddr); pc+=2; }
    function iba() { x=sp; }
    function ibc() { opLDY(AbsoluteXAddr); pc+=2; }
    function ibd() { opLDA(AbsoluteXAddr); pc+=2; }
    function ibe() { opLDX(AbsoluteYAddr); pc+=2; }
    function ic0() {
	var tbyte=ImmediateByte();
	flags &=~(fCAR+fZER+fNEG);
	if (y==tbyte) {
	    flags |=fCAR+fZER;
	}
	else if (y>tbyte) {
	    flags |=fCAR;
	}
	else {
	    flags |=fNEG;
	}
	pc++;
    }
    function ic1() { opCMP(IndirectXAddr); pc++; }
    function ic4() { opCPY(ZeroPageAddr); pc++; }
    function ic5() { opCMP(ZeroPageAddr); pc++; }
    function ic6() { opDECR(ZeroPageAddr); pc++; }
    function ic8() { y++; y&=255; FlagsNZ(y); }
    function ic9() {
	var tbyte=ImmediateByte();
	flags &=~(fCAR+fZER+fNEG);
	if (a==tbyte) {
	    flags |=fCAR+fZER;
	}
	else if (a>tbyte) {
	    flags |=fCAR;
	}
	else {
	    flags |=fNEG;
	}
	pc++;
    }
    function ica() { x--; x&=255; FlagsNZ(x); }
    function icc() { opCPY(AbsoluteAddr); pc+=2; }
    function icd() { opCMP(AbsoluteAddr); pc+=2; }
    function ice() { opDECR(AbsoluteAddr); pc+=2; }
    function id0() { opBCL(fZER); }
    function id1() { opCMP(IndirectYAddr); pc++; }
    function id5() { opCMP(ZeroPageXAddr); pc++; }
    function id6() { opDECR(ZeroPageXAddr); pc++; }
    function id8() { opCLR(fDEC); }
    function id9() { opCMP(AbsoluteYAddr); pc+=2; }
    function idd() { opCMP(AbsoluteXAddr); pc+=2; }
    function ide() { opDECR(AbsoluteXAddr); pc+=2; }
    function ie0() {
	var tbyte=ImmediateByte();
	flags &=~(fCAR+fZER+fNEG);
	if (x==tbyte) {
	    flags |=fCAR+fZER;
	}
	else if (x>tbyte) {
	    flags |=fCAR;
	}
	else {
	    flags |=fNEG;
	}
	pc++;
    }
    function ie1() { opSBC(IndirectXAddr); pc++; }
    function ie4() { opCPX(ZeroPageAddr); pc++; }
    function ie5() { opSBC(ZeroPageAddr); pc++; }
    function ie6() { opINCR(ZeroPageAddr); pc++; }
    function ie8() { x++; x&=255; FlagsNZ(x); }
    function ie9() {
	var data=ImmediateByte();
	data = a-data-((flags&fCAR)?0:1);
	flags &=~(fCAR+fZER+fOVF+fNEG);
	if (data==0) {
	    flags |= fZER+fCAR;
	}
	else if (data>0) {
	    flags |= fCAR;
	}
	else {
	    flags |= fOVF;
	}
	data &= 255;
	flags |= data&128;
	a=data;
	pc++;
    }
    function iea() {}
    function iec() { opCPX(AbsoluteAddr); pc+=2; }
    function ied() { opSBC(AbsoluteAddr); pc+=2; }
    function iee() { opINCR(AbsoluteAddr); pc+=2; }
    function if0() { opBST(fZER); }
    function if1() { opSBC(IndirectYAddr); pc++; }
    function if5() { opSBC(ZeroPageXAddr); pc++; }
    function if6() { opINCR(ZeroPageXAddr); pc++; }
    function if8() { opSET(fDEC); }
    function if9() { opSBC(AbsoluteYAddr); pc+=2; }
    function ifd() { opSBC(AbsoluteXAddr); pc+=2; }
    function ife() { opINCR(AbsoluteXAddr); pc+=2; }

    function ini() {
	log("unkop "+ByteAt(pc-1)+" pc="+(pc-1));
	breakFlag=true;
    }

    // code pages

    var instruct = [
	i00, i01, ini, ini, i04, i05, i06, ini,
	i08, i09, i0a, ini, i0c, i0d, i0e, ini,
	i10, i11, ini, ini, i04, i15, i16, ini,
	i18, i19, iea, ini, i0c, i1d, i1e, ini,
	i20, i21, ini, ini, i24, i25, i26, ini,
	i28, i29, i2a, ini, i2c, i2d, i2e, ini,
	i30, i31, ini, ini, i04, i35, i36, ini,
	i38, i39, iea, ini, i0c, i3d, i3e, ini,
	i40, i41, ini, ini, i04, i45, i46, ini,
	i48, i49, i4a, ini, i4c, i4d, i4e, ini,
	i50, i51, ini, ini, i04, i55, i56, ini,
	i58, i59, iea, ini, i0c, i5d, i5e, ini,
	i60, i61, ini, ini, i04, i65, i66, ini,
	i68, i69, i6a, ini, i6c, i6d, i6e, ini,
	i70, i71, ini, ini, i04, i75, i76, ini,
	i78, i79, iea, ini, i0c, i7d, i7e, ini,
	i04, i81, i04, ini, i84, i85, i86, ini,
	i88, i04, i8a, ini, i8c, i8d, i8e, ini,
	i90, i91, ini, ini, i94, i95, i96, ini,
	i98, i99, i9a, ini, ini, i9d, ini, ini,
	ia0, ia1, ia2, ini, ia4, ia5, ia6, ini,
	ia8, ia9, iaa, ini, iac, iad, iae, ini,
	ib0, ib1, ini, ini, ib4, ib5, ib6, ini,
	ib8, ib9, iba, ini, ibc, ibd, ibe, ini,
	ic0, ic1, i04, ini, ic4, ic5, ic6, ini,
	ic8, ic9, ica, ini, icc, icd, ice, ini,
	id0, id1, ini, ini, i04, id5, id6, ini,
	id8, id9, iea, ini, i0c, idd, ide, ini,
	ie0, ie1, i04, ini, ie4, ie5, ie6, ini,
	ie8, ie9, iea, ini, iec, ied, iee, ini,
	if0, if1, ini, ini, i04, if5, if6, ini,
	if8, if9, iea, ini, i0c, ifd, ife, ini
    ];

    // main

    function run(_pc,_a) {
	pc=_pc;
	a=_a;
	x=y=0;
	sp=253;
	RAM[0x1fd]=255;
	RAM[0x1fe]=1;
	flags=32;
	breakFlag=false;
	do {
	    var instructCode =ImmediateByte();
//	    print ("pc="+pc+" opcode "+instructCode);
	    pc++;
	    pc &=0xffff;
	    instruct[instructCode]();
	    pc &=0xffff;
	} while (!breakFlag);
	return hash;
    }

    return { RAM: RAM, run: run };
}

//var cpu = new CPU6502(function (addr, val) { print("d addr "+addr+" val "+val); });

/*
var cpu = new CPU6502(function (addr, val) { print("d addr "+addr+" val "+val); });
var f = [ 0xa9, 0x66, 0x8d, 0x1e, 0xd4, 0x60 ];
for (i=0; i<6; i++) cpu.RAM[i+1000]=f[i];
cpu.run(1000);
*/