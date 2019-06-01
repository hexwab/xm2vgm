var gbsplay =  function (io) {
  var Module;
// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (ENVIRONMENT_IS_WEB) {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
    this['Module'] = Module;
  } else if (ENVIRONMENT_IS_WORKER) {
    // We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          alignSize = type.alignSize || QUANTUM_SIZE;
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [null,null],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
function jsCall() {
  var args = Array.prototype.slice.call(arguments);
  return Runtime.functionPointers[args[0]].apply(null, args.slice(1));
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addOnPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 22312;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([112,18,1,0,0,0,0,0,112,18,1,0,0,0,0,0,112,18,1,0,0,0,0,0,1,0,0,0,0,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,50,0,0,0,245,229,1,48,0,17,16,255,33,159,0,42,18,19,11,120,177,32,248,225,229,1,14,0,9,42,224,6,42,224,7,17,255,255,203,87,62,1,40,2,62,4,18,225,241,87,229,1,8,0,9,42,102,111,122,1,140,0,197,233,251,118,225,229,1,10,0,9,42,102,111,122,1,157,0,197,233,24,237,128,191,0,0,191,0,63,0,0,191,127,255,159,0,191,0,255,0,0,191,119,243,241,0,0,0,0,0,0,0,0,0,172,221,218,72,54,2,207,22,44,4,229,44,172,221,218,72,0,86,0,0,0,40,0,0,0,102,0,0,0,48,0,0,0,18,0,0,0,70,0,0,0,94,0,0,0,16,0,0,0,122,0,0,0,74,0,0,0,102,0,0,0,132,0,0,0,18,0,0,0,70,0,0,0,94,0,0,0,38,0,0,0,72,0,0,0,40,0,0,0,102,0,0,0,48,0,0,0,18,0,0,0,70,0,0,0,94,0,0,0,148,0,0,0,56,0,0,0,74,0,0,0,102,0,0,0,132,0,0,0,18,0,0,0,70,0,0,0,94,0,0,0,128,0,0,0,106,0,0,0,40,0,0,0,102,0,0,0,48,0,0,0,18,0,0,0,70,0,0,0,94,0,0,0,26,0,0,0,106,0,0,0,74,0,0,0,102,0,0,0,132,0,0,0,18,0,0,0,70,0,0,0,94,0,0,0,144,0,0,0,106,0,0,0,40,0,0,0,102,0,0,0,48,0,0,0,18,0,0,0,70,0,0,0,94,0,0,0,32,0,0,0,106,0,0,0,74,0,0,0,102,0,0,0,132,0,0,0,18,0,0,0,70,0,0,0,94,0,0,0,64,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,10,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,116,0,0,0,82,0,0,0,82,0,0,0,82,0,0,0,82,0,0,0,82,0,0,0,82,0,0,0,82,0,0,0,82,0,0,0,120,0,0,0,120,0,0,0,120,0,0,0,120,0,0,0,120,0,0,0,120,0,0,0,120,0,0,0,120,0,0,0,96,0,0,0,96,0,0,0,96,0,0,0,96,0,0,0,96,0,0,0,96,0,0,0,96,0,0,0,96,0,0,0,110,0,0,0,110,0,0,0,110,0,0,0,110,0,0,0,110,0,0,0,110,0,0,0,110,0,0,0,110,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,88,0,0,0,88,0,0,0,88,0,0,0,88,0,0,0,88,0,0,0,88,0,0,0,88,0,0,0,88,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,26,0,0,0,54,0,0,0,138,0,0,0,24,0,0,0,130,0,0,0,112,0,0,0,46,0,0,0,100,0,0,0,60,0,0,0,54,0,0,0,34,0,0,0,24,0,0,0,142,0,0,0,112,0,0,0,78,0,0,0,84,0,0,0,60,0,0,0,54,0,0,0,138,0,0,0,24,0,0,0,26,0,0,0,112,0,0,0,46,0,0,0,28,0,0,0,60,0,0,0,54,0,0,0,52,0,0,0,24,0,0,0,26,0,0,0,112,0,0,0,26,0,0,0,114,0,0,0,60,0,0,0,6,0,0,0,138,0,0,0,6,0,0,0,26,0,0,0,26,0,0,0,46,0,0,0,12,0,0,0,60,0,0,0,20,0,0,0,118,0,0,0,44,0,0,0,26,0,0,0,26,0,0,0,26,0,0,0,42,0,0,0,60,0,0,0,6,0,0,0,138,0,0,0,6,0,0,0,14,0,0,0,26,0,0,0,46,0,0,0,36,0,0,0,60,0,0,0,80,0,0,0,98,0,0,0,58,0,0,0,126,0,0,0,26,0,0,0,26,0,0,0,62,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,1,2,4,6,0,0,0,0,146,0,0,0,76,0,0,0,134,0,0,0,140,0,0,0,136,0,0,0,124,0,0,0,30,0,0,0,68,0,0,0,105,111,114,101,97,100,32,102,114,111,109,32,48,120,37,48,52,120,32,117,110,105,109,112,108,101,109,101,110,116,101,100,46,10,0,0,0,0,0,0,87,97,114,110,105,110,103,58,32,70,105,108,101,32,67,82,67,32,100,111,101,115,32,110,111,116,32,109,97,116,99,104,32,40,48,120,37,48,56,120,32,33,61,32,48,120,37,48,56,120,41,46,10,0,0,0,87,97,114,110,105,110,103,58,32,69,120,116,101,110,100,101,100,32,104,101,97,100,101,114,32,102,111,117,110,100,44,32,98,117,116,32,67,82,67,32,100,111,101,115,32,110,111,116,32,109,97,116,99,104,32,40,48,120,37,48,56,120,32,33,61,32,48,120,37,48,56,120,41,46,10,0,0,0,0,0,71,66,83,88,0,0,0,0,71,66,83,32,86,101,114,115,105,111,110,32,37,100,32,117,110,115,117,112,112,111,114,116,101,100,46,10,0,0,0,0,66,97,110,107,32,37,108,100,32,111,117,116,32,111,102,32,114,97,110,103,101,32,40,48,45,37,108,100,41,33,10,0,10,10,85,110,107,110,111,119,110,32,111,112,99,111,100,101,32,37,48,50,120,46,10,0,78,111,116,32,97,32,71,66,83,45,70,105,108,101,0,0,67,80,85,32,108,111,99,107,101,100,32,117,112,32,40,104,97,108,116,32,119,105,116,104,32,105,110,116,101,114,114,117,112,116,115,32,100,105,115,97,98,108,101,100,41,46,10,0,105,111,119,114,105,116,101,32,116,111,32,48,120,37,48,52,120,32,117,110,105,109,112,108,101,109,101,110,116,101,100,32,40,118,97,108,61,37,48,50,120,41,46,10,0,0,0,0,10,10,85,110,107,110,111,119,110,32,67,66,32,115,117,98,111,112,99,111,100,101,32,37,48,50,120,46,10,0,0,0,71,66,83,0,0,0,0,0,83,117,98,115,111,110,103,32,110,117,109,98,101,114,32,111,117,116,32,111,102,32,114,97,110,103,101,32,40,109,105,110,61,48,44,32,109,97,120,61,37,108,100,41,46,10,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:35,EIDRM:36,ECHRNG:37,EL2NSYNC:38,EL3HLT:39,EL3RST:40,ELNRNG:41,EUNATCH:42,ENOCSI:43,EL2HLT:44,EDEADLK:45,ENOLCK:46,EBADE:50,EBADR:51,EXFULL:52,ENOANO:53,EBADRQC:54,EBADSLT:55,EDEADLOCK:56,EBFONT:57,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:74,EDOTDOT:76,EBADMSG:77,ENOTUNIQ:80,EBADFD:81,EREMCHG:82,ELIBACC:83,ELIBBAD:84,ELIBSCN:85,ELIBMAX:86,ELIBEXEC:87,ENOSYS:88,ENOTEMPTY:90,ENAMETOOLONG:91,ELOOP:92,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:106,EPROTOTYPE:107,ENOTSOCK:108,ENOPROTOOPT:109,ESHUTDOWN:110,ECONNREFUSED:111,EADDRINUSE:112,ECONNABORTED:113,ENETUNREACH:114,ENETDOWN:115,ETIMEDOUT:116,EHOSTDOWN:117,EHOSTUNREACH:118,EINPROGRESS:119,EALREADY:120,EDESTADDRREQ:121,EMSGSIZE:122,EPROTONOSUPPORT:123,ESOCKTNOSUPPORT:124,EADDRNOTAVAIL:125,ENETRESET:126,EISCONN:127,ENOTCONN:128,ETOOMANYREFS:129,EUSERS:131,EDQUOT:132,ESTALE:133,ENOTSUP:134,ENOMEDIUM:135,EILSEQ:138,EOVERFLOW:139,ECANCELED:140,ENOTRECOVERABLE:141,EOWNERDEAD:142,ESTRPIPE:143};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"No message of desired type",36:"Identifier removed",37:"Channel number out of range",38:"Level 2 not synchronized",39:"Level 3 halted",40:"Level 3 reset",41:"Link number out of range",42:"Protocol driver not attached",43:"No CSI structure available",44:"Level 2 halted",45:"Deadlock condition",46:"No record locks available",50:"Invalid exchange",51:"Invalid request descriptor",52:"Exchange full",53:"No anode",54:"Invalid request code",55:"Invalid slot",56:"File locking deadlock error",57:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",74:"Multihop attempted",76:"Cross mount point (not really error)",77:"Trying to read unreadable message",80:"Given log. name not unique",81:"f.d. invalid for this operation",82:"Remote address changed",83:"Can   access a needed shared lib",84:"Accessing a corrupted shared lib",85:".lib section in a.out corrupted",86:"Attempting to link in too many libs",87:"Attempting to exec a shared library",88:"Function not implemented",90:"Directory not empty",91:"File or path name too long",92:"Too many symbolic links",95:"Operation not supported on transport endpoint",96:"Protocol family not supported",104:"Connection reset by peer",105:"No buffer space available",106:"Address family not supported by protocol family",107:"Protocol wrong type for socket",108:"Socket operation on non-socket",109:"Protocol not available",110:"Can't send after socket shutdown",111:"Connection refused",112:"Address already in use",113:"Connection aborted",114:"Network is unreachable",115:"Network interface is not configured",116:"Connection timed out",117:"Host is down",118:"Host is unreachable",119:"Connection already in progress",120:"Socket already connected",121:"Destination address required",122:"Message too long",123:"Unknown protocol",124:"Socket type not supported",125:"Address not available",126:"Connection reset by network",127:"Socket is already connected",128:"Socket is not connected",129:"Too many references",131:"Too many users",132:"Quota exceeded",133:"Stale file handle",134:"Not supported",135:"No medium (in tape drive)",138:"Illegal byte sequence",139:"Value too large for defined data type",140:"Operation canceled",141:"State not recoverable",142:"Previous owner died",143:"Streams pipe error"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var VFS=undefined;
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path, ext) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var f = PATH.splitPath(path)[2];
        if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }
        return f;
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.filter(function(p, index) {
          if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
          }
          return p;
        }).join('/'));
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          // this wouldn't be required if the library wasn't eval'd at first...
          if (!TTY.utf8) {
            TTY.utf8 = new Runtime.UTF8Processor();
          }
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              if (process.stdin.destroyed) {
                return undefined;
              }
              result = process.stdin.read();
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={mount:function (mount) {
        return MEMFS.create_node(null, '/', 0040000 | 0777, 0);
      },create_node:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek
          };
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap
          };
          node.contents = [];
        } else if (FS.isLink(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          };
          node.stream_ops = {};
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = FS.chrdev_stream_ops;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.create_node(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.create_node(parent, newname, 0777 | 0120000, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          var size = Math.min(contents.length - position, length);
          if (contents.subarray) { // typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          stream.node.timestamp = Date.now();
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 0x02)) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            assert(contents.buffer === buffer || contents.buffer === buffer.buffer);
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,nodes:[null],devices:[null],streams:[null],nextInode:1,name_table:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        },handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + new Error().stack;
        return ___setErrNo(e.errno);
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.name_table.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.name_table[hash];
        FS.name_table[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.name_table[hash] === node) {
          FS.name_table[hash] = node.name_next;
        } else {
          var current = FS.name_table[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.name_table[hash]; node; node = node.name_next) {
          if (node.parent.id === parent.id && node.name === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        var node = {
          id: FS.nextInode++,
          name: name,
          mode: mode,
          node_ops: {},
          stream_ops: {},
          rdev: rdev,
          parent: null,
          mount: null
        };
        if (!parent) {
          parent = node;  // root node sets parent to itself
        }
        node.parent = parent;
        node.mount = parent.mount;
        // compatibility
        var readMode = 292 | 73;
        var writeMode = 146;
        // NOTE we must use Object.defineProperties instead of individual calls to
        // Object.defineProperty in order to make closure compiler happy
        Object.defineProperties(node, {
          read: {
            get: function() { return (node.mode & readMode) === readMode; },
            set: function(val) { val ? node.mode |= readMode : node.mode &= ~readMode; }
          },
          write: {
            get: function() { return (node.mode & writeMode) === writeMode; },
            set: function(val) { val ? node.mode |= writeMode : node.mode &= ~writeMode; }
          },
          isFolder: {
            get: function() { return FS.isDir(node.mode); },
          },
          isDevice: {
            get: function() { return FS.isChrdev(node.mode); },
          },
        });
        FS.hashAddNode(node);
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 0170000) === 0100000;
      },isDir:function (mode) {
        return (mode & 0170000) === 0040000;
      },isLink:function (mode) {
        return (mode & 0170000) === 0120000;
      },isChrdev:function (mode) {
        return (mode & 0170000) === 0020000;
      },isBlkdev:function (mode) {
        return (mode & 0170000) === 0060000;
      },isFIFO:function (mode) {
        return (mode & 0170000) === 0010000;
      },cwd:function () {
        return FS.currentPath;
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.currentPath, path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            return path ? PATH.join(node.mount.mountpoint, path) : node.mount.mountpoint;
          }
          path = path ? PATH.join(node.name, path) : node.name;
          node = node.parent;
        }
      },flagModes:{"r":0,"rs":8192,"r+":2,"w":1537,"wx":3585,"xw":3585,"w+":1538,"wx+":3586,"xw+":3586,"a":521,"ax":2569,"xa":2569,"a+":522,"ax+":2570,"xa+":2570},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 3;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 1024)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayMknod:function (mode) {
        switch (mode & 0170000) {
          case 0100000:
          case 0020000:
          case 0060000:
          case 0010000:
          case 0140000:
            return 0;
          default:
            return ERRNO_CODES.EINVAL;
        }
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.currentPath) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 3) !== 0 ||  // opening for write
              (flags & 1024)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        // compatibility
        Object.defineProperties(stream, {
          object: {
            get: function() { return stream.node; },
            set: function(val) { stream.node = val; }
          },
          isRead: {
            get: function() { return (stream.flags & 3) !== 1; }
          },
          isWrite: {
            get: function() { return (stream.flags & 3) !== 0; }
          },
          isAppend: {
            get: function() { return (stream.flags & 8); }
          }
        });
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join(parent, part);
          try {
            FS.mkdir(current, 0777);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(path, mode | 146);
          var stream = FS.open(path, 'w');
          FS.write(stream, data, 0, data.length, 0);
          FS.close(stream);
          FS.chmod(path, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = input && output ? 0777 : (input ? 0333 : 0555);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = PATH.resolve(PATH.join(parent, name));
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp', 0777);
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev', 0777);
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', 0666, FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', 0666, FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', 0666, FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm', 0777);
        FS.mkdir('/dev/shm/tmp', 0777);
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },staticInit:function () {
        FS.name_table = new Array(4096);
        FS.root = FS.createNode(null, '/', 0040000 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },mount:function (type, opts, mountpoint) {
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
        }
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode &= 4095;
        mode |= 0100000;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode &= 511 | 0001000;
        mode |= 0040000;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        mode |= 0020000;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        path = PATH.normalize(path);
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 512)) {
          mode = (mode & 4095) | 0100000;
        } else {
          mode = 0;
        }
        var node;
        try {
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 0200000)
          });
          node = lookup.node;
          path = lookup.path;
        } catch (e) {
          // ignore
        }
        // perhaps we need to create the node
        if ((flags & 512)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 2048)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~1024;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 1024)) {
          FS.truncate(node, 0);
        }
        // register the stream with the filesystem
        var stream = FS.createStream({
          path: path,
          node: node,
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 8) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 3) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      }};
  function _send(fd, buf, len, flags) {
      var info = FS.getStream(fd);
      if (!info) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (info.socket.readyState === WebSocket.CLOSING || info.socket.readyState === WebSocket.CLOSED) {
        ___setErrNo(ERRNO_CODES.ENOTCONN);
        return -1;
      } else if (info.socket.readyState === WebSocket.CONNECTING) {
        ___setErrNo(ERRNO_CODES.EAGAIN);
        return -1;
      }
      info.sender(HEAPU8.subarray(buf, buf+len));
      return len;
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (stream && ('socket' in stream)) {
        return _send(fildes, buf, nbyte, 0);
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _llvm_uadd_with_overflow_i16(x, y) {
      x = x & 0xffff;
      y = y & 0xffff;
      return ((asm["setTempRet0"](x+y > 65535),(x+y) & 0xffff)|0);
    }
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stderr|0;var p=+env.NaN;var q=+env.Infinity;var r=0;var s=0;var t=0;var u=0;var v=0,w=0,x=0,y=0,z=0.0,A=0,B=0,C=0,D=0.0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=global.Math.floor;var P=global.Math.abs;var Q=global.Math.sqrt;var R=global.Math.pow;var S=global.Math.cos;var T=global.Math.sin;var U=global.Math.tan;var V=global.Math.acos;var W=global.Math.asin;var X=global.Math.atan;var Y=global.Math.atan2;var Z=global.Math.exp;var _=global.Math.log;var $=global.Math.ceil;var aa=global.Math.imul;var ab=env.abort;var ac=env.assert;var ad=env.asmPrintInt;var ae=env.asmPrintFloat;var af=env.min;var ag=env.jsCall;var ah=env.invoke_vi;var ai=env.invoke_vii;var aj=env.invoke_ii;var ak=env.invoke_viii;var al=env.invoke_v;var am=env.invoke_iii;var an=env.invoke_viiii;var ao=env._strncmp;var ap=env._pwrite;var aq=env._sysconf;var ar=env._sbrk;var as=env.___setErrNo;var at=env._fwrite;var au=env.__reallyNegative;var av=env.__formatString;var aw=env._send;var ax=env._write;var ay=env._llvm_uadd_with_overflow_i16;var az=env._abort;var aA=env._fprintf;var aB=env._time;var aC=env.___errno_location;var aD=env._fflush;
// EMSCRIPTEN_START_FUNCS
function aL(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7>>3<<3;return b|0}function aM(){return i|0}function aN(a){a=a|0;i=a}function aO(a,b){a=a|0;b=b|0;if((r|0)==0){r=a;s=b}}function aP(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function aQ(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function aR(a){a=a|0;E=a}function aS(a){a=a|0;F=a}function aT(a){a=a|0;G=a}function aU(a){a=a|0;H=a}function aV(a){a=a|0;I=a}function aW(a){a=a|0;J=a}function aX(a){a=a|0;K=a}function aY(a){a=a|0;L=a}function aZ(a){a=a|0;M=a}function a_(a){a=a|0;N=a}function a$(){}function a0(a,b){a=a|0;b=b|0;c[986]=a;c[984]=b;return}function a1(a){a=a|0;return d[(c[942]|0)+(a&16383)|0]|0|0}function a2(a){a=a|0;return d[(c[942]|0)+(c[8]<<14|a&16383)|0]|0|0}function a3(b,c){b=b|0;c=c|0;a[12632+(b&8191)|0]=c;return}function a4(a){a=a|0;return d[12632+(a&8191)|0]|0|0}function a5(b,c){b=b|0;c=c|0;a[3952+(b&8191)|0]=c;return}function a6(a){a=a|0;return d[3952+(a&8191)|0]|0|0}function a7(d,e){d=d|0;e=e|0;var f=0,g=0,h=0;f=i;bb(c[d+172>>2]|0,c[d+176>>2]|0);if((e|0)==-1){g=(c[d+12>>2]|0)-1|0}else{g=e}e=c[d+8>>2]|0;if((g|0)<(e|0)){c[d+232>>2]=g;b[6305]=80;b[6304]=b[d+22>>1]|0;b[6302]=(b[d+16>>1]|0)-112&65535;a[12606]=g&255;g=d+184|0;c[g>>2]=0;c[g+4>>2]=0;h=1;i=f;return h|0}else{g=c[o>>2]|0;d=e-1|0;aA(g|0,3712,(g=i,i=i+8|0,c[g>>2]=d,g)|0)|0;i=g;h=0;i=f;return h|0}return 0}function a8(a,b){a=a|0;b=b|0;var d=0,e=0;d=bs(b)|0;if((d|0)<0){e=0;return e|0}b=a+184|0;a=cy(c[b>>2]|0,c[b+4>>2]|0,d,(d|0)<0?-1:0)|0;c[b>>2]=a;c[b+4>>2]=E;e=1;return e|0}function a9(a){a=a|0;cu(c[a+64>>2]|0);cu(a);return}function ba(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=i;h=cs(248)|0;j=h;cw(h|0,0,248);c[h+208>>2]=2;c[h+204>>2]=120;c[h+216>>2]=2;c[h+212>>2]=3;c[h>>2]=e;if((ao(e|0,3704,3)|0)!=0){k=c[o>>2]|0;at(3560,14,1,k|0)|0;l=0;i=g;return l|0}k=a[e+3|0]|0;m=k<<24>>24;n=h+4|0;c[n>>2]=m;if(k<<24>>24!=1){k=c[o>>2]|0;aA(k|0,3472,(p=i,i=i+8|0,c[p>>2]=m,p)|0)|0;i=p;l=0;i=g;return l|0}m=a[e+4|0]|0;c[h+8>>2]=m;c[h+12>>2]=a[e+5|0]|0;k=h+16|0;b[k>>1]=d[e+7|0]<<8|d[e+6|0];b[h+18>>1]=d[e+9|0]<<8|d[e+8|0];b[h+20>>1]=d[e+11|0]<<8|d[e+10|0];b[h+22>>1]=d[e+13|0]<<8|d[e+12|0];a[h+24|0]=a[e+14|0]|0;a[h+25|0]=a[e+15|0]|0;q=h+72|0;r=e+16|0;cx(q|0,r|0,32)|0;r=h+105|0;s=e+48|0;cx(r|0,s|0,32)|0;s=h+138|0;t=e+80|0;cx(s|0,t|0,30)|0;u=h+28|0;c[u>>2]=q;q=h+32|0;c[q>>2]=r;r=h+36|0;c[r>>2]=s;c[h+44>>2]=e+112;v=h+52|0;c[v>>2]=f;x=m<<3;m=cs(x)|0;y=h+64|0;c[y>>2]=m;cw(m|0,0,x|0);x=(a[e+111|0]<<8)+(a[e+110|0]|0)<<4;m=h+40|0;c[m>>2]=x;z=x+112|0;do{if(z>>>0<(f-8|0)>>>0){if((ao(e+z|0,3464,4)|0)!=0){A=31;break}B=e+(x+112)|0;C=h+48|0;c[C>>2]=B;D=e+(x+120)|0;E=d[e+(x+123)|0]<<24|(d[e+(x+122)|0]<<16|(d[e+(x+121)|0]<<8|d[D]));F=(d[e+((x|7)+112)|0]<<24|(d[e+((x|6)+112)|0]<<16|(d[e+((x|5)+112)|0]<<8|d[e+((x|4)+112)|0])))+8|0;G=D;w=0;a[G]=w&255;w=w>>8;a[G+1|0]=w&255;w=w>>8;a[G+2|0]=w&255;w=w>>8;a[G+3|0]=w&255;G=cg(0,B,F)|0;if((G|0)==(E|0)){F=c[C>>2]|0;c[v>>2]=d[F+15|0]<<24|(d[F+14|0]<<16|(d[F+13|0]<<8|d[F+12|0]));C=F+16|0;c[h+56>>2]=d[F+19|0]<<24|(d[F+18|0]<<16|(d[F+17|0]<<8|d[C]));B=C;w=0;a[B]=w&255;w=w>>8;a[B+1|0]=w&255;w=w>>8;a[B+2|0]=w&255;w=w>>8;a[B+3|0]=w&255;H=F;I=1;break}else{F=c[o>>2]|0;aA(F|0,3384,(p=i,i=i+16|0,c[p>>2]=E,c[p+8>>2]=G,p)|0)|0;i=p;A=31;break}}else{A=31}}while(0);if((A|0)==31){cx(s|0,t|0,32)|0;c[m>>2]=f-112;H=0;I=0}f=cg(0,e,c[v>>2]|0)|0;v=h+60|0;c[v>>2]=f;do{if(I){c[n>>2]=2;t=a[H+28|0]|0;s=t<<24>>24;A=c[h+48>>2]|0;x=(s<<3)+32|0;z=h+68|0;c[z>>2]=A+x;G=d[H+21|0]<<8|d[H+20|0];E=d[H+23|0]<<8|d[H+22|0];F=d[H+25|0]<<8|d[H+24|0];if((G|0)!=65535){c[u>>2]=A+(x+G)}if((E|0)!=65535){c[q>>2]=A+(x+E)}if((F|0)!=65535){c[r>>2]=A+(x+F)}if(t<<24>>24>0){t=0;do{F=t<<3;x=d[H+(F+37)|0]<<8|d[H+(F+36)|0];c[(c[y>>2]|0)+(t<<3)>>2]=d[H+(F+35)|0]<<24|(d[H+(F+34)|0]<<16|(d[H+(F+33)|0]<<8|d[H+(F+32)|0]));if((x|0)==65535){c[(c[y>>2]|0)+(t<<3)+4>>2]=0}else{c[(c[y>>2]|0)+(t<<3)+4>>2]=(c[z>>2]|0)+x}t=t+1|0;}while((t|0)<(s|0));J=c[v>>2]|0}else{J=f}s=c[h+56>>2]|0;if((s|0)==(J|0)){break}t=c[o>>2]|0;aA(t|0,3328,(p=i,i=i+16|0,c[p>>2]=s,c[p+8>>2]=J,p)|0)|0;i=p}}while(0);p=c[m>>2]|0;m=b[k>>1]|0;J=m&65535;f=p+16383+J&-16384;c[h+176>>2]=f;v=ct(1,f)|0;f=h+172|0;c[f>>2]=v;h=v+(J-112)|0;J=p+112|0;cx(h|0,e|0,J)|0;J=v+80|0;cx(J|0,1064,127)|0;J=0;e=m;m=v;while(1){v=J<<3;h=(e&65535)+v|0;a[m+v|0]=-61;a[(c[f>>2]|0)+(v|1)|0]=h&255;a[(c[f>>2]|0)+(v|2)|0]=h>>>8&255;h=J+1|0;if((h|0)>=8){break}J=h;e=b[k>>1]|0;m=c[f>>2]|0}a[(c[f>>2]|0)+64|0]=-55;a[(c[f>>2]|0)+72|0]=-55;l=j;i=g;return l|0}function bb(b,d){b=b|0;d=d|0;c[942]=b;c[950]=((d+16383|0)>>>14)-1;c[8]=1;a[2216]=1;c[3087]=4;c[3084]=1;c[3069]=1;c[3107]=4;c[3104]=1;c[3089]=1;c[3127]=4;c[3124]=1;c[3109]=1;c[3147]=4;c[3144]=1;c[3129]=1;cw(12632,0,8192);cw(3952,0,8192);cw(12144,0,128);cw(3808,0,128);c[940]=0;bt();bo(0,63,66,14);bo(64,127,66,8);bo(160,191,92,16);bo(192,254,90,6);bo(255,255,22,12);return}function bc(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;if((a-8192|0)>>>0>=8192){i=d;return}a=b&31;b=(a<<24>>24==0)+(a&255)|0;c[8]=b;a=c[950]|0;if((b|0)<=(a|0)){i=d;return}aA(c[o>>2]|0,3504,(e=i,i=i+16|0,c[e>>2]=b,c[e+8>>2]=a,e)|0)|0;i=e;c[8]=c[950];i=d;return}function bd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=((b-65296|0)>>>0)/5|0;aK[c[986]&7](c[940]|0,b,e,c[984]|0);h=b&127;if((b-65408|0)>>>0<127){a[12144+h|0]=e;i=f;return}a[3808+h|0]=e;switch(b|0){case 65317:{h=e&255;c[3070]=h>>>4&1;c[3071]=h&1;c[3090]=h>>>5&1;c[3091]=h>>>1&1;c[3110]=h>>>6&1;c[3111]=h>>>2&1;c[3130]=h>>>7;c[3131]=h>>>3&1;i=f;return};case 65318:{a[3846]=-128;i=f;return};case 65301:case 65311:case 65280:case 65316:case 65319:case 65320:case 65321:case 65322:case 65323:case 65324:case 65325:case 65326:case 65327:case 65328:case 65329:case 65330:case 65331:case 65332:case 65333:case 65334:case 65335:case 65336:case 65337:case 65338:case 65339:case 65340:case 65341:case 65342:case 65343:case 65535:{i=f;return};case 65286:case 65287:{h=a[3815]|0;j=aa(16<<(((h&255)<<1)+6&6),256-(d[3814]|0)|0)|0;c[4]=j;if((h&-16)<<24>>24!=-128){i=f;return}c[4]=(j|0)/2|0;i=f;return};case 65296:{j=e&255;h=j>>>4&7;c[3079]=h;c[3080]=h;c[3078]=j>>>3&1;c[3081]=j&7;i=f;return};case 65297:case 65302:case 65312:{j=e&255;h=a[3248+(j>>>6)|0]|0;c[12348+(g*80|0)>>2]=h;c[12344+(g*80|0)>>2]=(aa(c[12336+(g*80|0)>>2]|0,h)|0)/8|0;c[12328+(g*80|0)>>2]=64-(j&63)<<1;i=f;return};case 65298:case 65303:case 65313:{j=e&255;c[12296+(g*80|0)>>2]=j>>>4;c[12300+(g*80|0)>>2]=j>>>3&1;h=j<<3&56;c[12304+(g*80|0)>>2]=h;c[12308+(g*80|0)>>2]=h;i=f;return};case 65299:case 65300:case 65304:case 65305:case 65309:case 65310:{h=g*5|0;j=a[h+3828|0]|0;k=2048-((j&255)<<8&1792|d[h+3827|0])|0;c[12336+(g*80|0)>>2]=k;c[12344+(g*80|0)>>2]=(aa(k,c[12348+(g*80|0)>>2]|0)|0)/8|0;switch(b|0){case 65309:case 65304:case 65299:{i=f;return};default:{}}c[12332+(g*80|0)>>2]=(j&255)>>>6&1;i=f;return};case 65306:{c[3109]=(d[3834]|0)>>>7&255;i=f;return};case 65307:{c[3122]=256-(e&255)<<1;i=f;return};case 65308:{c[3114]=(d[3836]|0)>>>5&3;i=f;return};case 65314:case 65315:{j=d[3842]|0;k=j>>>4;h=j&7;c[3145]=0;j=1<<k;c[3144]=j;if((h|0)==0){l=(j|0)/2|0}else{l=h<<k}c[3144]=l;if((b|0)==65314){i=f;return}c[12332+(g*80|0)>>2]=(d[3843]|0)>>>6&1;i=f;return};default:{aA(c[o>>2]|0,3624,(g=i,i=i+16|0,c[g>>2]=b,c[g+8>>2]=e&255,g)|0)|0;i=g;i=f;return}}}function be(a,b){a=a|0;b=b|0;return}function bf(a,b){a=a|0;b=b|0;return}function bg(a,b){a=a|0;b=b|0;c[3156]=1;return}function bh(b,c){b=b|0;c=c|0;var d=0,e=0;c=a[12606|0]|0;b=(c&255)>>>7;d=c<<1&255|b;c=b<<4;if((d|0)==0){e=(c|128)&255}else{e=c&255}a[12607|0]=e;a[12606|0]=d&255;return}function bi(b,c){b=b|0;c=c|0;var d=0;c=a[12606|0]|0;b=(c&255)>>>1|c<<7;d=c<<4&16;a[12607|0]=b<<24>>24==0?d|-128:d;a[12606|0]=b;return}function bj(b,c){b=b|0;c=c|0;var e=0;c=a[12606]|0;b=(d[12607]|0)>>>4&1|c<<1;e=(c&255)>>>7<<4;a[12607]=b<<24>>24==0?e|-128:e;a[12606]=b;return}function bk(b,c){b=b|0;c=c|0;var d=0;c=a[12606]|0;b=a[12607]<<3&-128|(c&255)>>>1;d=c<<4&16;a[12607]=b<<24>>24==0?d|-128:d;a[12606]=b;return}function bl(b,c){b=b|0;c=c|0;a[12606]=~a[12606];a[12607]=a[12607]|96;return}function bm(b,c){b=b|0;c=c|0;a[12607]=a[12607]&-113|16;return}function bn(b,c){b=b|0;c=c|0;a[12607]=a[12607]&-97^16;return}function bo(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;if(a>>>0>b>>>0){return}else{f=a}do{c[40+(f<<2)>>2]=d;c[2224+(f<<2)>>2]=e;f=f+1|0;}while(f>>>0<=b>>>0);return}function bp(a,c){a=a|0;c=c|0;c=12600+(a>>>4<<1&6)|0;b[c>>1]=(b[c>>1]|0)+1&65535;return}function bq(a,c){a=a|0;c=c|0;c=12600+(a>>>4<<1&6)|0;b[c>>1]=(b[c>>1]|0)-1&65535;return}function br(a){a=a|0;var b=0,e=0,f=0;b=i;L142:do{if((a-65408|0)>>>0<127){e=d[12144+(a&127)|0]|0}else{if((a-65296|0)>>>0<48){e=d[3808+(a&127)|0]|0;break}switch(a|0){case 65535:{e=d[3935]|0;break L142;break};case 65280:{e=0;break L142;break};default:{aA(c[o>>2]|0,3288,(f=i,i=i+8|0,c[f>>2]=a,f)|0)|0;i=f;e=255;break L142}}}}while(0);i=b;return e|0}function bs(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if((b|0)>0){d=0}else{e=0;return e|0}L155:while(1){f=b-d|0;g=c[2]|0;h=(g|0)>0&(g|0)<(f|0)?g:f;f=c[6]|0;i=(f|0)>0&(f|0)<(h|0)?f:h;if((i|0)>0){h=0;do{f=bv()|0;if((f|0)<0){e=f;j=147;break L155}h=f+h|0;c[940]=(c[940]|0)+f;}while((h|0)<(i|0));k=h;l=c[2]|0}else{k=0;l=g}if((l|0)>0){i=l-k|0;c[2]=i;m=i}else{m=l}do{if((m|0)<1&(c[3154]|0)!=0){if((a[3935]&1)==0){break}c[2]=m+70256;bu(64)}}while(0);g=c[6]|0;if((g|0)>0){h=g-k|0;c[6]=h;n=h}else{n=g}do{if((n|0)<1&(c[3154]|0)!=0){if((a[3935]&4)==0){break}c[6]=(c[4]|0)+n;bu(72)}}while(0);g=k+d|0;if((g|0)<(b|0)){d=g}else{e=g;j=148;break}}if((j|0)==147){return e|0}else if((j|0)==148){return e|0}return 0}function bt(){cw(12600,0,12);c[3156]=0;c[3148]=0;c[3154]=0;return}function bu(a){a=a|0;var d=0,f=0,g=0;c[3156]=0;d=b[6305]|0;f=e[6304]|0;g=f-2|0;b[6304]=g&65535;aF[c[40+(g>>>8<<2)>>2]&255](g,d&255);g=f-1|0;aF[c[40+(g>>>8<<2)>>2]&255](g,(d&65535)>>>8&255);b[6305]=a&65535;return}function bv(){var a=0,d=0,e=0,f=0;a=c[3156]|0;if((a|0)==0){d=b[6305]|0;b[6305]=d+1&65535;e=d&65535;d=(aG[c[2224+(e>>>8<<2)>>2]&31](e)|0)&255;e=1192+(d<<2)|0;aF[c[e>>2]&255](d,e);f=1;return f|0}if((a|0)==1&(c[3154]|0)==0){a=c[o>>2]|0;at(3576,47,1,a|0)|0;c[3148]=1;f=-1;return f|0}else{f=(c[3148]|0)==0?16:-1;return f|0}return 0}function bw(a,d){a=a|0;d=d|0;var e=0,f=0;d=b[6305]|0;e=d&65535;b[6305]=d+2&65535;d=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;f=e+1|0;e=a>>>4&3;b[12600+(((e|0)==3)+e<<1)>>1]=((aG[c[2224+(f>>>8<<2)>>2]&31](f)|0)<<8)+d&65535;return}function bx(d,f){d=d|0;f=f|0;var g=0,h=0,i=0;f=d>>>4;g=f&3;h=g-((g|0)==3)|0;g=12600+(h<<1)|0;i=e[g>>1]|0;if((d&8|0)==0){aF[c[40+(i>>>8<<2)>>2]&255](i,a[12606]|0)}else{a[12606]=(aG[c[2224+(i>>>8<<2)>>2]&31](i)|0)&255}if((h|0)!=2){return}b[g>>1]=(f<<1&2^2)+65535+i&65535;return}function by(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,i=0;d=b>>>3&7;if((d|0)==6){b=e[6302]|0;f=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0;b=(f&255)+1&255;g=e[6302]|0;aF[c[40+(g>>>8<<2)>>2]&255](g,b);h=f;i=b}else{b=12600+(d^1)|0;d=a[b]|0;f=d+1&255;a[b]=f;h=d&255;i=f}f=a[12607]&31;d=i<<24>>24==0?f|-128:f;a[12607]=(h&15)>>>0>(i&15)>>>0?d|32:d;return}function bz(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,i=0;d=b>>>3&7;if((d|0)==6){b=e[6302]|0;f=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0;b=(f&255)-1&255;g=e[6302]|0;aF[c[40+(g>>>8<<2)>>2]&255](g,b);h=f;i=b}else{b=12600+(d^1)|0;d=a[b]|0;f=d-1&255;a[b]=f;h=d&255;i=f}f=a[12607]&31|(i<<24>>24==0?-64:64);a[12607]=(h&15)>>>0>(i&15)>>>0?f|32:f;return}function bA(d,f){d=d|0;f=f|0;var g=0;f=b[6305]|0;g=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0;g=d>>>3&7;if((g|0)==6){d=e[6302]|0;aF[c[40+(d>>>8<<2)>>2]&255](d,f&255);return}else{a[12600+(g^1)|0]=f&255;return}}function bB(a,d){a=a|0;d=d|0;var e=0;d=b[6305]|0;a=d&65535;b[6305]=d+2&65535;d=aG[c[2224+(a>>>8<<2)>>2]&31](a)|0;e=a+1|0;a=((aG[c[2224+(e>>>8<<2)>>2]&31](e)|0)<<8)+d|0;d=b[6304]|0;aF[c[40+(a>>>8<<2)>>2]&255](a,d&255);e=a+1|0;aF[c[40+(e>>>8<<2)>>2]&255](e,(d&65535)>>>8&255);return}function bC(c,d){c=c|0;d=d|0;var e=0,f=0;d=c>>>4&3;c=b[6302]|0;e=ay(c|0,b[12600+(((d|0)==3)+d<<1)>>1]|0)|0;d=e;b[6302]=d;e=a[12607]&-113;f=E?e|16:e;a[12607]=(c&4095)>>>0>(d&4095)>>>0?f|32:f;return}function bD(a,d){a=a|0;d=d|0;d=b[6305]|0;a=d&65535;b[6305]=d+1&65535;d=(aG[c[2224+(a>>>8<<2)>>2]&31](a)|0)<<24>>24;b[6305]=(e[6305]|0)+d&65535;return}function bE(d,f){d=d|0;f=f|0;var g=0;f=b[6305]|0;g=f&65535;b[6305]=f+1&65535;f=(aG[c[2224+(g>>>8<<2)>>2]&31](g)|0)<<24>>24;L222:do{switch(d>>>3&3|0){case 0:{if((a[12607]|0)>=0){break L222}return};case 1:{if((a[12607]|0)<=-1){break L222}return};case 2:{if((a[12607]&16)==0){break L222}return};case 3:{if((a[12607]&16)!=0){break L222}return};default:{}}}while(0);b[6305]=(e[6305]|0)+f&65535;return}function bF(a,b){a=a|0;b=b|0;var d=0;b=i;aA(c[o>>2]|0,3536,(d=i,i=i+8|0,c[d>>2]=a&255,d)|0)|0;i=d;c[3148]=1;i=b;return}function bG(b,d){b=b|0;d=d|0;var f=0,g=0;d=b&7;f=b>>>3&7;if((d|0)==6){b=e[6302]|0;g=(aG[c[2224+(b>>>8<<2)>>2]&31](b)|0)&255}else{g=a[12600+(d^1)|0]|0}if((f|0)==6){d=e[6302]|0;aF[c[40+(d>>>8<<2)>>2]&255](d,g);return}else{a[12600+(f^1)|0]=g;return}}function bH(b,f){b=b|0;f=f|0;var g=0,h=0,i=0,j=0;f=a[12606]|0;g=b&7;if((g|0)==6){b=e[6302]|0;h=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0;i=h;j=a[12606]|0}else{i=d[12600+(g^1)|0]|0;j=f}g=(j&255)+i|0;a[12606]=g&255;i=f&255;f=g&255;j=i>>>0>f>>>0?16:0;h=(i&15)>>>0>(g&15)>>>0?j|32:j;a[12607]=(f|0)==0?h|-128:h;return}function bI(b,f){b=b|0;f=f|0;var g=0,h=0,i=0,j=0;f=a[12606]|0;g=b&7;if((g|0)==6){b=e[6302]|0;h=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0;i=h;j=a[12606]|0}else{i=d[12600+(g^1)|0]|0;j=f}g=a[12607]|0;h=((g&255)>>>4&1)+((j&255)+i)|0;i=h&255;a[12606]=i;j=(f&255)>(i&255)?g&-81|16:g&-81;g=(f&15)>>>0>(h&15)>>>0?j|32:j&-97;a[12607]=i<<24>>24==0?g|-128:g&63;return}function bJ(b,f){b=b|0;f=f|0;var g=0,h=0,i=0,j=0;f=a[12606]|0;g=b&7;if((g|0)==6){b=e[6302]|0;h=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0;i=h;j=a[12606]|0}else{i=d[12600+(g^1)|0]|0;j=f}g=(j&255)-i|0;a[12606]=g&255;i=f&255;f=g&255;j=i>>>0<f>>>0?80:64;h=(i&15)>>>0<(g&15)>>>0?j|32:j;a[12607]=(f|0)==0?h|-128:h;return}function bK(b,f){b=b|0;f=f|0;var g=0,h=0,i=0,j=0;f=a[12606]|0;g=b&7;if((g|0)==6){b=e[6302]|0;h=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0;i=h;j=a[12606]|0}else{i=d[12600+(g^1)|0]|0;j=f}g=(j&255)-i-((d[12607]|0)>>>4&1)|0;a[12606]=g&255;i=f&255;f=g&255;j=i>>>0<f>>>0?80:64;h=(i&15)>>>0<(g&15)>>>0?j|32:j;a[12607]=(f|0)==0?h|-128:h;return}function bL(b,f){b=b|0;f=f|0;var g=0;f=b&7;if((f|0)==6){b=e[6302]|0;g=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0}else{g=d[12600+(f^1)|0]|0}f=(d[12606]|0)&g&255;a[12606]=f;a[12607]=f<<24>>24==0?-96:32;return}function bM(a,b){a=a|0;b=b|0;c[3154]=0;return}function bN(a,b){a=a|0;b=b|0;c[3154]=1;return}function bO(a,c){a=a|0;c=c|0;b[6305]=b[6302]|0;return}function bP(a,c){a=a|0;c=c|0;b[6304]=b[6302]|0;return}function bQ(b,f){b=b|0;f=f|0;var g=0;f=b&7;if((f|0)==6){b=e[6302]|0;g=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0}else{g=d[12600+(f^1)|0]|0}f=((d[12606]|0)^g)&255;a[12606]=f;a[12607]=f<<24>>24==0?-128:0;return}function bR(b,f){b=b|0;f=f|0;var g=0;f=b&7;if((f|0)==6){b=e[6302]|0;g=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0}else{g=d[12600+(f^1)|0]|0}f=(d[12606]|0|g)&255;a[12606]=f;a[12607]=f<<24>>24==0?-128:0;return}function bS(b,f){b=b|0;f=f|0;var g=0,h=0,i=0;f=a[12606]|0;g=b&7;if((g|0)==6){b=e[6302]|0;h=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0}else{h=d[12600+(g^1)|0]|0}g=f&255;f=g-h|0;h=f&255;b=g>>>0<h>>>0?80:64;i=(g&15)>>>0<(f&15)>>>0?b|32:b;a[12607]=(h|0)==0?i|-128:i;return}function bT(d,e){d=d|0;e=e|0;var f=0,g=0;L289:do{switch(d>>>3&3|0){case 0:{if((a[12607]|0)>=0){break L289}return};case 1:{if((a[12607]|0)<=-1){break L289}return};case 2:{if((a[12607]&16)==0){break L289}return};case 3:{if((a[12607]&16)!=0){break L289}return};default:{}}}while(0);d=b[6304]|0;e=d&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;g=e+1|0;e=((aG[c[2224+(g>>>8<<2)>>2]&31](g)|0)<<8)+f|0;b[6304]=d+2&65535;b[6305]=e&65535;return}function bU(a,d){a=a|0;d=d|0;var e=0,f=0,g=0;d=b[6304]|0;e=d&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;g=e+1|0;e=((aG[c[2224+(g>>>8<<2)>>2]&31](g)|0)<<8)+f|0;b[6304]=d+2&65535;b[12600+(a>>>4<<1&6)>>1]=e&65535;return}function bV(d,e){d=d|0;e=e|0;var f=0,g=0;e=b[6305]|0;f=e&65535;b[6305]=e+2&65535;e=aG[c[2224+(f>>>8<<2)>>2]&31](f)|0;g=f+1|0;f=((aG[c[2224+(g>>>8<<2)>>2]&31](g)|0)<<8)+e&65535;L302:do{switch(d>>>3&3|0){case 0:{if((a[12607]|0)>=0){break L302}return};case 1:{if((a[12607]|0)<=-1){break L302}return};case 2:{if((a[12607]&16)==0){break L302}return};case 3:{if((a[12607]&16)!=0){break L302}return};default:{}}}while(0);b[6305]=f;return}function bW(a,d){a=a|0;d=d|0;var e=0;d=b[6305]|0;a=d&65535;b[6305]=d+2&65535;d=aG[c[2224+(a>>>8<<2)>>2]&31](a)|0;e=a+1|0;b[6305]=((aG[c[2224+(e>>>8<<2)>>2]&31](e)|0)<<8)+d&65535;return}function bX(d,f){d=d|0;f=f|0;var g=0,h=0;f=b[6305]|0;g=f&65535;b[6305]=f+2&65535;f=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0;h=g+1|0;g=((aG[c[2224+(h>>>8<<2)>>2]&31](h)|0)<<8)+f&65535;L315:do{switch(d>>>3&3|0){case 0:{if((a[12607]|0)>=0){break L315}return};case 1:{if((a[12607]|0)<=-1){break L315}return};case 2:{if((a[12607]&16)==0){break L315}return};case 3:{if((a[12607]&16)!=0){break L315}return};default:{}}}while(0);d=b[6305]|0;f=e[6304]|0;h=f-2|0;b[6304]=h&65535;aF[c[40+(h>>>8<<2)>>2]&255](h,d&255);h=f-1|0;aF[c[40+(h>>>8<<2)>>2]&255](h,(d&65535)>>>8&255);b[6305]=g;return}function bY(a,d){a=a|0;d=d|0;var f=0;d=b[12600+(a>>>4<<1&6)>>1]|0;a=e[6304]|0;f=a-2|0;b[6304]=f&65535;aF[c[40+(f>>>8<<2)>>2]&255](f,d&255);f=a-1|0;aF[c[40+(f>>>8<<2)>>2]&255](f,(d&65535)>>>8&255);return}function bZ(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;f=b[6305]|0;e=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;e=d[12606]|0;g=e+f|0;a[12606]=g&255;f=g&255;h=e>>>0>f>>>0?16:0;i=(e&15)>>>0>(g&15)>>>0?h|32:h;a[12607]=(f|0)==0?i|-128:i;return}function b_(a,d){a=a|0;d=d|0;var f=0,g=0;d=b[6305]|0;f=e[6304]|0;g=f-2|0;b[6304]=g&65535;aF[c[40+(g>>>8<<2)>>2]&255](g,d&255);g=f-1|0;aF[c[40+(g>>>8<<2)>>2]&255](g,(d&65535)>>>8&255);b[6305]=a&56;return}function b$(a,d){a=a|0;d=d|0;var e=0,f=0;d=b[6304]|0;a=d&65535;e=aG[c[2224+(a>>>8<<2)>>2]&31](a)|0;f=a+1|0;a=((aG[c[2224+(f>>>8<<2)>>2]&31](f)|0)<<8)+e|0;b[6304]=d+2&65535;b[6305]=a&65535;return}function b0(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;g=i;f=b[6305]|0;h=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(h>>>8<<2)>>2]&31](h)|0;switch(f>>>6|0){case 0:{h=3256+((f>>>3&7)<<2)|0;aF[c[h>>2]&255](f,h);i=g;return};case 1:{h=f&7;j=a[12607]&31|-96;a[12607]=j;if((h|0)==6){k=e[6302]|0;l=aG[c[2224+(k>>>8<<2)>>2]&31](k)|0;m=l;n=a[12607]|0}else{m=d[12600+(h^1)|0]|0;n=j}a[12607]=(m<<8>>>(((f>>>3&7)+1|0)>>>0)&128^n&255)&255;i=g;return};case 2:{n=f&7;m=f>>>3&7;if((n|0)==6){j=e[6302]|0;h=(aG[c[2224+(j>>>8<<2)>>2]&31](j)|0)&(1<<m^255);j=e[6302]|0;aF[c[40+(j>>>8<<2)>>2]&255](j,h&255);i=g;return}else{h=12600+(n^1)|0;a[h]=(d[h]|0)&(1<<m^255)&255;i=g;return}break};case 3:{m=f&7;h=f>>>3&7;if((m|0)==6){n=e[6302]|0;j=aG[c[2224+(n>>>8<<2)>>2]&31](n)|0|1<<h;n=e[6302]|0;aF[c[40+(n>>>8<<2)>>2]&255](n,j&255);i=g;return}else{j=12600+(m^1)|0;a[j]=(d[j]|0|1<<h)&255;i=g;return}break};default:{aA(c[o>>2]|0,3672,(h=i,i=i+8|0,c[h>>2]=f&255,h)|0)|0;i=h;c[3148]=1;i=g;return}}}function b1(a,d){a=a|0;d=d|0;var f=0,g=0;d=b[6305]|0;a=d&65535;b[6305]=d+2&65535;d=aG[c[2224+(a>>>8<<2)>>2]&31](a)|0;f=a+1|0;a=((aG[c[2224+(f>>>8<<2)>>2]&31](f)|0)<<8)+d&65535;d=b[6305]|0;f=e[6304]|0;g=f-2|0;b[6304]=g&65535;aF[c[40+(g>>>8<<2)>>2]&255](g,d&255);g=f-1|0;aF[c[40+(g>>>8<<2)>>2]&255](g,(d&65535)>>>8&255);b[6305]=a;return}function b2(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;f=b[6305]|0;e=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;e=d[12606]|0;g=a[12607]|0;h=e+f+((g&255)>>>4&1)|0;a[12606]=h&255;f=h&255;i=e>>>0>f>>>0?g&-81|16:g&-81;g=(e&15)>>>0>(h&15)>>>0?i|32:i&-97;a[12607]=(f|0)==0?g|-128:g&63;return}function b3(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;f=b[6305]|0;e=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;e=d[12606]|0;g=e-f|0;a[12606]=g&255;f=g&255;h=e>>>0<f>>>0?80:64;i=(e&15)>>>0<(g&15)>>>0?h|32:h;a[12607]=(f|0)==0?i|-128:i;return}function b4(a,d){a=a|0;d=d|0;var e=0,f=0;d=b[6304]|0;a=d&65535;e=aG[c[2224+(a>>>8<<2)>>2]&31](a)|0;f=a+1|0;a=((aG[c[2224+(f>>>8<<2)>>2]&31](f)|0)<<8)+e|0;b[6304]=d+2&65535;b[6305]=a&65535;return}function b5(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;f=b[6305]|0;e=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;e=d[12606]|0;g=e-f-((d[12607]|0)>>>4&1)|0;a[12606]=g&255;f=g&255;h=e>>>0<f>>>0?80:64;i=(e&15)>>>0<(g&15)>>>0?h|32:h;a[12607]=(f|0)==0?i|-128:i;return}function b6(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;f=(e&2|0)==0;if(f){g=b[6305]|0;h=g&65535;b[6305]=g+1&65535;i=aG[c[2224+(h>>>8<<2)>>2]&31](h)|0}else{i=0}if((e&16|0)==0){if(f){j=i}else{j=d[12600]|0}e=j+65280|0;aF[c[40+(e>>>8<<2)>>2]&255](e,a[12606]|0);return}else{if(f){k=i}else{k=d[12600]|0}i=k+65280|0;a[12606]=(aG[c[2224+(i>>>8<<2)>>2]&31](i)|0)&255;return}}function b7(e,f){e=e|0;f=f|0;f=b[6305]|0;e=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;e=(d[12606]|0)&f&255;a[12606]=e;a[12607]=e<<24>>24==0?-96:32;return}function b8(d,f){d=d|0;f=f|0;var g=0;f=b[6305]|0;d=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(d>>>8<<2)>>2]&31](d)|0;d=e[6304]|0;g=d+(f<<24>>24)|0;b[6304]=g&65535;f=d>>>0>(g&65535)>>>0?16:0;a[12607]=(d&4095)>>>0>(g&4095)>>>0?f|32:f;return}function b9(d,e){d=d|0;e=e|0;var f=0;e=b[6305]|0;d=e&65535;b[6305]=e+2&65535;e=aG[c[2224+(d>>>8<<2)>>2]&31](d)|0;f=d+1|0;d=((aG[c[2224+(f>>>8<<2)>>2]&31](f)|0)<<8)+e|0;aF[c[40+(d>>>8<<2)>>2]&255](d,a[12606]|0);return}function ca(e,f){e=e|0;f=f|0;f=b[6305]|0;e=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;e=((d[12606]|0)^f)&255;a[12606]=e;a[12607]=e<<24>>24==0?-128:0;return}function cb(e,f){e=e|0;f=f|0;f=b[6305]|0;e=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;e=(d[12606]|0|f)&255;a[12606]=e;a[12607]=e<<24>>24==0?-128:0;return}function cc(d,f){d=d|0;f=f|0;var g=0;f=b[6305]|0;d=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(d>>>8<<2)>>2]&31](d)|0;d=e[6304]|0;g=d+(f<<24>>24)|0;b[6302]=g&65535;f=d>>>0>(g&65535)>>>0?16:0;a[12607]=(d&4095)>>>0>(g&4095)>>>0?f|32:f;return}function cd(d,e){d=d|0;e=e|0;var f=0;e=b[6305]|0;d=e&65535;b[6305]=e+2&65535;e=aG[c[2224+(d>>>8<<2)>>2]&31](d)|0;f=d+1|0;d=((aG[c[2224+(f>>>8<<2)>>2]&31](f)|0)<<8)+e|0;a[12606]=(aG[c[2224+(d>>>8<<2)>>2]&31](d)|0)&255;return}function ce(a){a=a|0;return 255}function cf(a,b){a=a|0;b=b|0;return}function cg(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if((c[5461]|0)==0){c[5206]=0;f=128;g=1;do{g=((g&1|0)!=0?-306674912:0)^g>>>1;h=f<<1;i=0;do{c[20824+(i+f<<2)>>2]=c[20824+(i<<2)>>2]^g;i=i+h|0;}while(i>>>0<256);f=f>>>1;}while((f|0)!=0)}f=~a;if((e|0)==0){j=f;k=~j;return k|0}else{l=f;m=b;n=e}while(1){e=n-1|0;b=c[20824+(((d[m]|0)^l&255)<<2)>>2]^l>>>8;if((e|0)==0){j=b;break}else{l=b;m=m+1|0;n=e}}k=~j;return k|0}function ch(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;f=b[6305]|0;e=f&65535;b[6305]=f+1&65535;f=aG[c[2224+(e>>>8<<2)>>2]&31](e)|0;e=d[12606]|0;g=e-f|0;f=g&255;h=e>>>0<f>>>0?80:64;i=(e&15)>>>0<(g&15)>>>0?h|32:h;a[12607]=(f|0)==0?i|-128:i;return}function ci(b,f){b=b|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;f=b&7;b=(f|0)==6;if(b){g=e[6302]|0;h=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0}else{h=d[12600+(f^1)|0]|0}g=h&255;h=g>>>7;i=h<<4;j=g<<1&254|h;if((j|0)==0){k=(i|128)&255}else{k=i&255}a[12607]=k;if(b){b=e[6302]|0;aF[c[40+(b>>>8<<2)>>2]&255](b,j&255);return}else{a[12600+(f^1)|0]=j&255;return}}function cj(b,f){b=b|0;f=f|0;var g=0,h=0,i=0;f=b&7;b=(f|0)==6;if(b){g=e[6302]|0;h=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0}else{h=d[12600+(f^1)|0]|0}g=h&255;i=h<<4&16;h=g<<7&128|g>>>1;a[12607]=(h|0)==0?i|-128:i;if(b){b=e[6302]|0;aF[c[40+(b>>>8<<2)>>2]&255](b,h&255);return}else{a[12600+(f^1)|0]=h&255;return}}function ck(b,f){b=b|0;f=f|0;var g=0,h=0,i=0,j=0;f=b&7;b=(f|0)==6;if(b){g=e[6302]|0;h=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0}else{h=d[12600+(f^1)|0]|0}g=h&255;h=g>>>7<<4;i=(d[12607]|0)>>>4&1|g<<1&254;if((i|0)==0){j=(h|128)&255}else{j=h&255}a[12607]=j;if(b){b=e[6302]|0;aF[c[40+(b>>>8<<2)>>2]&255](b,i&255);return}else{a[12600+(f^1)|0]=i&255;return}}function cl(b,f){b=b|0;f=f|0;var g=0,h=0,i=0;f=b&7;b=(f|0)==6;if(b){g=e[6302]|0;h=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0}else{h=d[12600+(f^1)|0]|0}g=h<<4&16;i=(d[12607]|0)<<3&128|h>>>1&127;a[12607]=(i|0)==0?g|-128:g;if(b){b=e[6302]|0;aF[c[40+(b>>>8<<2)>>2]&255](b,i&255);return}else{a[12600+(f^1)|0]=i&255;return}}function cm(b,f){b=b|0;f=f|0;var g=0,h=0,i=0,j=0;f=b&7;b=(f|0)==6;if(b){g=e[6302]|0;h=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0}else{h=d[12600+(f^1)|0]|0}g=h&255;h=g<<1;i=g>>>7<<4;if((h&254|0)==0){j=(i|128)&255}else{j=i&255}a[12607]=j;if(b){b=e[6302]|0;aF[c[40+(b>>>8<<2)>>2]&255](b,h&255);return}else{a[12600+(f^1)|0]=h&255;return}}function cn(b,f){b=b|0;f=f|0;var g=0,h=0,i=0;f=b&7;b=(f|0)==6;if(b){g=e[6302]|0;h=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0}else{h=d[12600+(f^1)|0]|0}g=h<<4&16;i=h>>>1&127|h&128;a[12607]=(i|0)==0?g|-128:g;if(b){b=e[6302]|0;aF[c[40+(b>>>8<<2)>>2]&255](b,i&255);return}else{a[12600+(f^1)|0]=i&255;return}}function co(b,f){b=b|0;f=f|0;var g=0;f=b&7;if((f|0)==6){b=e[6302]|0;g=aG[c[2224+(b>>>8<<2)>>2]&31](b)|0;b=g>>>4|g<<4;a[12607]=(b|0)==0?-128:0;g=e[6302]|0;aF[c[40+(g>>>8<<2)>>2]&255](g,b&255);return}else{b=12600+(f^1)|0;f=d[b]|0;g=f>>>4|f<<4;a[12607]=(g|0)==0?-128:0;a[b]=g&255;return}}function cp(b,f){b=b|0;f=f|0;var g=0,h=0,i=0;f=b&7;b=(f|0)==6;if(b){g=e[6302]|0;h=aG[c[2224+(g>>>8<<2)>>2]&31](g)|0}else{h=d[12600+(f^1)|0]|0}g=h<<4&16;i=h>>>1&127;a[12607]=(i|0)==0?g|-128:g;if(b){b=e[6302]|0;aF[c[40+(b>>>8<<2)>>2]&255](b,i&255);return}else{a[12600+(f^1)|0]=i&255;return}}function cq(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;a0(6,d);d=ba(a,b)|0;if((d|0)==0){f=0;return f|0}b=e-1|0;c[d+232>>2]=b;c[d+204>>2]=0;c[d+208>>2]=0;c[d+216>>2]=2;c[d+212>>2]=3;a7(d,b)|0;f=d;return f|0}function cr(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if((d|0)==0){return}aH[d&7](a,b,c);return}function cs(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,aA=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[5462]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=21888+(h<<2)|0;j=21888+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[5462]=e&~(1<<g)}else{if(l>>>0<(c[5466]|0)>>>0){az();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{az();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[5464]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=21888+(p<<2)|0;m=21888+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[5462]=e&~(1<<r)}else{if(l>>>0<(c[5466]|0)>>>0){az();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{az();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[5464]|0;if((l|0)!=0){q=c[5467]|0;d=l>>>3;l=d<<1;f=21888+(l<<2)|0;k=c[5462]|0;h=1<<d;do{if((k&h|0)==0){c[5462]=k|h;s=f;t=21888+(l+2<<2)|0}else{d=21888+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[5466]|0)>>>0){s=g;t=d;break}az();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[5464]=m;c[5467]=e;n=i;return n|0}l=c[5463]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[22152+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[5466]|0;if(r>>>0<i>>>0){az();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){az();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){az();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){az();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){az();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{az();return 0}}}while(0);L571:do{if((e|0)!=0){f=d+28|0;i=22152+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[5463]=c[5463]&~(1<<c[f>>2]);break L571}else{if(e>>>0<(c[5466]|0)>>>0){az();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L571}}}while(0);if(v>>>0<(c[5466]|0)>>>0){az();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[5466]|0)>>>0){az();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[5466]|0)>>>0){az();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[5464]|0;if((f|0)!=0){e=c[5467]|0;i=f>>>3;f=i<<1;q=21888+(f<<2)|0;k=c[5462]|0;g=1<<i;do{if((k&g|0)==0){c[5462]=k|g;y=q;z=21888+(f+2<<2)|0}else{i=21888+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[5466]|0)>>>0){y=l;z=i;break}az();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[5464]=p;c[5467]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[5463]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[22152+(A<<2)>>2]|0;L619:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L619}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[22152+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[5464]|0)-g|0)>>>0){o=g;break}q=K;m=c[5466]|0;if(q>>>0<m>>>0){az();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){az();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){az();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){az();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){az();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{az();return 0}}}while(0);L669:do{if((e|0)!=0){i=K+28|0;m=22152+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[5463]=c[5463]&~(1<<c[i>>2]);break L669}else{if(e>>>0<(c[5466]|0)>>>0){az();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L669}}}while(0);if(L>>>0<(c[5466]|0)>>>0){az();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[5466]|0)>>>0){az();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[5466]|0)>>>0){az();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;m=21888+(e<<2)|0;r=c[5462]|0;j=1<<i;do{if((r&j|0)==0){c[5462]=r|j;O=m;P=21888+(e+2<<2)|0}else{i=21888+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[5466]|0)>>>0){O=d;P=i;break}az();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=22152+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[5463]|0;l=1<<Q;if((m&l|0)==0){c[5463]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=579;break}else{l=l<<1;m=j}}if((T|0)==579){if(S>>>0<(c[5466]|0)>>>0){az();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[5466]|0;if(m>>>0<i>>>0){az();return 0}if(j>>>0<i>>>0){az();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[5464]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[5467]|0;if(S>>>0>15){R=J;c[5467]=R+o;c[5464]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[5464]=0;c[5467]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[5465]|0;if(o>>>0<J>>>0){S=J-o|0;c[5465]=S;J=c[5468]|0;K=J;c[5468]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[944]|0)==0){J=aq(8)|0;if((J-1&J|0)==0){c[946]=J;c[945]=J;c[947]=-1;c[948]=-1;c[949]=0;c[5573]=0;c[944]=(aB(0)|0)&-16^1431655768;break}else{az();return 0}}}while(0);J=o+48|0;S=c[946]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[5572]|0;do{if((O|0)!=0){P=c[5570]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L761:do{if((c[5573]&4|0)==0){O=c[5468]|0;L763:do{if((O|0)==0){T=609}else{L=O;P=22296;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=609;break L763}else{P=M}}if((P|0)==0){T=609;break}L=R-(c[5465]|0)&Q;if(L>>>0>=2147483647){W=0;break}m=ar(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=618}}while(0);do{if((T|0)==609){O=ar(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[945]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[5570]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}m=c[5572]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=ar($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=618}}while(0);L783:do{if((T|0)==618){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=629;break L761}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[946]|0;O=K-_+g&-g;if(O>>>0>=2147483647){ac=_;break}if((ar(O|0)|0)==-1){ar(m|0)|0;W=Y;break L783}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=629;break L761}}}while(0);c[5573]=c[5573]|4;ad=W;T=626}else{ad=0;T=626}}while(0);do{if((T|0)==626){if(S>>>0>=2147483647){break}W=ar(S|0)|0;Z=ar(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=629}}}while(0);do{if((T|0)==629){ad=(c[5570]|0)+aa|0;c[5570]=ad;if(ad>>>0>(c[5571]|0)>>>0){c[5571]=ad}ad=c[5468]|0;L803:do{if((ad|0)==0){S=c[5466]|0;if((S|0)==0|ab>>>0<S>>>0){c[5466]=ab}c[5574]=ab;c[5575]=aa;c[5577]=0;c[5471]=c[944];c[5470]=-1;S=0;do{Y=S<<1;ac=21888+(Y<<2)|0;c[21888+(Y+3<<2)>>2]=ac;c[21888+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[5468]=ab+ae;c[5465]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[5469]=c[948]}else{S=22296;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=641;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==641){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[5468]|0;Y=(c[5465]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[5468]=Z+ai;c[5465]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[5469]=c[948];break L803}}while(0);if(ab>>>0<(c[5466]|0)>>>0){c[5466]=ab}S=ab+aa|0;Y=22296;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=651;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==651){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[5468]|0)){J=(c[5465]|0)+K|0;c[5465]=J;c[5468]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[5467]|0)){J=(c[5464]|0)+K|0;c[5464]=J;c[5467]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L848:do{if(X>>>0<256){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=21888+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[5466]|0)>>>0){az();return 0}if((c[U+12>>2]|0)==(Z|0)){break}az();return 0}}while(0);if((Q|0)==(U|0)){c[5462]=c[5462]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[5466]|0)>>>0){az();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}az();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[5466]|0)>>>0){az();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[5466]|0)>>>0){az();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){az();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{az();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=22152+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[5463]=c[5463]&~(1<<c[P>>2]);break L848}else{if(m>>>0<(c[5466]|0)>>>0){az();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L848}}}while(0);if(an>>>0<(c[5466]|0)>>>0){az();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[5466]|0)>>>0){az();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[5466]|0)>>>0){az();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);as=ab+(($|al)+aa)|0;at=$+K|0}else{as=Z;at=K}J=as+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=at|1;c[ab+(at+W)>>2]=at;J=at>>>3;if(at>>>0<256){V=J<<1;X=21888+(V<<2)|0;P=c[5462]|0;m=1<<J;do{if((P&m|0)==0){c[5462]=P|m;au=X;av=21888+(V+2<<2)|0}else{J=21888+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[5466]|0)>>>0){au=U;av=J;break}az();return 0}}while(0);c[av>>2]=_;c[au+12>>2]=_;c[ab+(W+8)>>2]=au;c[ab+(W+12)>>2]=X;break}V=ac;m=at>>>8;do{if((m|0)==0){aw=0}else{if(at>>>0>16777215){aw=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;aw=at>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=22152+(aw<<2)|0;c[ab+(W+28)>>2]=aw;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[5463]|0;Q=1<<aw;if((X&Q|0)==0){c[5463]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((aw|0)==31){ax=0}else{ax=25-(aw>>>1)|0}Q=at<<ax;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(at|0)){break}ay=X+16+(Q>>>31<<2)|0;m=c[ay>>2]|0;if((m|0)==0){T=724;break}else{Q=Q<<1;X=m}}if((T|0)==724){if(ay>>>0<(c[5466]|0)>>>0){az();return 0}else{c[ay>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[5466]|0;if(X>>>0<$>>>0){az();return 0}if(m>>>0<$>>>0){az();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=22296;while(1){aA=c[W>>2]|0;if(aA>>>0<=Y>>>0){aD=c[W+4>>2]|0;aE=aA+aD|0;if(aE>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=aA+(aD-39)|0;if((W&7|0)==0){aF=0}else{aF=-W&7}W=aA+(aD-47+aF)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aG=0}else{aG=-_&7}_=aa-40-aG|0;c[5468]=ab+aG;c[5465]=_;c[ab+(aG+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[5469]=c[948];c[ac+4>>2]=27;c[W>>2]=c[5574];c[W+4>>2]=c[22300>>2];c[W+8>>2]=c[22304>>2];c[W+12>>2]=c[22308>>2];c[5574]=ab;c[5575]=aa;c[5577]=0;c[5576]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aE>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aE>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256){K=W<<1;Z=21888+(K<<2)|0;S=c[5462]|0;m=1<<W;do{if((S&m|0)==0){c[5462]=S|m;aH=Z;aI=21888+(K+2<<2)|0}else{W=21888+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[5466]|0)>>>0){aH=Q;aI=W;break}az();return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aJ=0}else{if(_>>>0>16777215){aJ=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aJ=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=22152+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[5463]|0;Q=1<<aJ;if((Z&Q|0)==0){c[5463]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=_<<aK;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aL=Z+16+(Q>>>31<<2)|0;m=c[aL>>2]|0;if((m|0)==0){T=759;break}else{Q=Q<<1;Z=m}}if((T|0)==759){if(aL>>>0<(c[5466]|0)>>>0){az();return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[5466]|0;if(Z>>>0<m>>>0){az();return 0}if(_>>>0<m>>>0){az();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[5465]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[5465]=_;ad=c[5468]|0;Q=ad;c[5468]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(aC()|0)>>2]=12;n=0;return n|0}function ct(a,b){a=a|0;b=b|0;var d=0,e=0;do{if((a|0)==0){d=0}else{e=aa(b,a)|0;if((b|a)>>>0<=65535){d=e;break}d=((e>>>0)/(a>>>0)|0|0)==(b|0)?e:-1}}while(0);b=cs(d)|0;if((b|0)==0){return b|0}if((c[b-4>>2]&3|0)==0){return b|0}cw(b|0,0,d|0);return b|0}function cu(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[5466]|0;if(b>>>0<e>>>0){az()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){az()}h=f&-8;i=a+(h-8)|0;j=i;L1032:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){az()}if((n|0)==(c[5467]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[5464]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=21888+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){az()}if((c[k+12>>2]|0)==(n|0)){break}az()}}while(0);if((s|0)==(k|0)){c[5462]=c[5462]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){az()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}az()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){az()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){az()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){az()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{az()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=22152+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[5463]=c[5463]&~(1<<c[v>>2]);q=n;r=o;break L1032}else{if(p>>>0<(c[5466]|0)>>>0){az()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1032}}}while(0);if(A>>>0<(c[5466]|0)>>>0){az()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[5466]|0)>>>0){az()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[5466]|0)>>>0){az()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){az()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){az()}do{if((e&2|0)==0){if((j|0)==(c[5468]|0)){B=(c[5465]|0)+r|0;c[5465]=B;c[5468]=q;c[q+4>>2]=B|1;if((q|0)!=(c[5467]|0)){return}c[5467]=0;c[5464]=0;return}if((j|0)==(c[5467]|0)){B=(c[5464]|0)+r|0;c[5464]=B;c[5467]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L1134:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=21888+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[5466]|0)>>>0){az()}if((c[u+12>>2]|0)==(j|0)){break}az()}}while(0);if((g|0)==(u|0)){c[5462]=c[5462]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[5466]|0)>>>0){az()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}az()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[5466]|0)>>>0){az()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[5466]|0)>>>0){az()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){az()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{az()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=22152+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[5463]=c[5463]&~(1<<c[t>>2]);break L1134}else{if(f>>>0<(c[5466]|0)>>>0){az()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L1134}}}while(0);if(E>>>0<(c[5466]|0)>>>0){az()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[5466]|0)>>>0){az()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[5466]|0)>>>0){az()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[5467]|0)){H=B;break}c[5464]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=21888+(d<<2)|0;A=c[5462]|0;E=1<<r;do{if((A&E|0)==0){c[5462]=A|E;I=e;J=21888+(d+2<<2)|0}else{r=21888+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[5466]|0)>>>0){I=h;J=r;break}az()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=22152+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[5463]|0;d=1<<K;do{if((r&d|0)==0){c[5463]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=946;break}else{A=A<<1;J=E}}if((N|0)==946){if(M>>>0<(c[5466]|0)>>>0){az()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[5466]|0;if(J>>>0<E>>>0){az()}if(B>>>0<E>>>0){az()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[5470]|0)-1|0;c[5470]=q;if((q|0)==0){O=22304}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[5470]=-1;return}function cv(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function cw(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function cx(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function cy(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(E=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function cz(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(E=e,a-c>>>0|0)|0}function cA(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){E=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}E=a<<c-32;return 0}function cB(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){E=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}E=0;return b>>>c-32|0}function cC(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){E=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}E=(b|0)<0?-1:0;return b>>c-32|0}function cD(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function cE(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function cF(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=aa(d,c)|0;f=a>>>16;a=(e>>>16)+(aa(d,f)|0)|0;d=b>>>16;b=aa(d,c)|0;return(E=(a>>>16)+(aa(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function cG(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=cz(e^a,f^b,e,f)|0;b=E;a=g^e;e=h^f;f=cz((cL(i,b,cz(g^c,h^d,g,h)|0,E,0)|0)^a,E^e,a,e)|0;return(E=E,f)|0}function cH(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=cz(h^a,j^b,h,j)|0;b=E;a=cz(k^d,l^e,k,l)|0;cL(m,b,a,E,g)|0;a=cz(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=E;i=f;return(E=j,a)|0}function cI(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=cF(e,a)|0;f=E;return(E=(aa(b,a)|0)+(aa(d,e)|0)+f|f&0,c|0|0)|0}function cJ(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=cL(a,b,c,d,0)|0;return(E=E,e)|0}function cK(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;cL(a,b,d,e,g)|0;i=f;return(E=c[g+4>>2]|0,c[g>>2]|0)|0}function cL(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(E=n,o)|0}else{if(!m){n=0;o=0;return(E=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(E=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(E=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(E=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((cE(l|0)|0)>>>0);return(E=n,o)|0}p=(cD(l|0)|0)-(cD(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(E=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(E=n,o)|0}else{if(!m){r=(cD(l|0)|0)-(cD(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(E=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(E=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(cD(j|0)|0)+33-(cD(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(E=n,o)|0}else{p=cE(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(E=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;F=t;G=0;H=0}else{g=d|0|0;d=k|e&0;e=cy(g,d,-1,-1)|0;k=E;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;cz(e,k,j,a)|0;b=E;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=cz(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=E;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;D=M;F=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=F;c[f+4>>2]=D}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(E=n,o)|0}function cM(a,b){a=a|0;b=b|0;aE[a&7](b|0)}function cN(a){a=a|0;ag(0,a|0)}function cO(a){a=a|0;ag(1,a|0)}function cP(a,b,c){a=a|0;b=b|0;c=c|0;aF[a&255](b|0,c|0)}function cQ(a,b){a=a|0;b=b|0;ag(0,a|0,b|0)}function cR(a,b){a=a|0;b=b|0;ag(1,a|0,b|0)}function cS(a,b){a=a|0;b=b|0;return aG[a&31](b|0)|0}function cT(a){a=a|0;return ag(0,a|0)|0}function cU(a){a=a|0;return ag(1,a|0)|0}function cV(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aH[a&7](b|0,c|0,d|0)}function cW(a,b,c){a=a|0;b=b|0;c=c|0;ag(0,a|0,b|0,c|0)}function cX(a,b,c){a=a|0;b=b|0;c=c|0;ag(1,a|0,b|0,c|0)}function cY(a){a=a|0;aI[a&7]()}function cZ(){ag(0)}function c_(){ag(1)}function c$(a,b,c){a=a|0;b=b|0;c=c|0;return aJ[a&7](b|0,c|0)|0}function c0(a,b){a=a|0;b=b|0;return ag(0,a|0,b|0)|0}function c1(a,b){a=a|0;b=b|0;return ag(1,a|0,b|0)|0}function c2(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aK[a&7](b|0,c|0,d|0,e|0)}function c3(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ag(0,a|0,b|0,c|0,d|0)}function c4(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ag(1,a|0,b|0,c|0,d|0)}function c5(a){a=a|0;ab(0)}function c6(a,b){a=a|0;b=b|0;ab(1)}function c7(a){a=a|0;ab(2);return 0}function c8(a,b,c){a=a|0;b=b|0;c=c|0;ab(3)}function c9(){ab(4)}function da(a,b){a=a|0;b=b|0;ab(5);return 0}function db(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ab(6)}
// EMSCRIPTEN_END_FUNCS
var aE=[c5,c5,cN,c5,cO,c5,c5,c5];var aF=[c6,c6,cQ,c6,cR,c6,b6,c6,bQ,c6,bg,c6,b7,c6,bM,c6,bh,c6,by,c6,b8,c6,bd,c6,bV,c6,bF,c6,b3,c6,co,c6,bm,c6,b$,c6,cb,c6,bi,c6,bw,c6,ca,c6,b9,c6,bY,c6,bp,c6,cf,c6,b4,c6,bT,c6,bD,c6,cd,c6,b_,c6,ch,c6,bn,c6,bc,c6,cp,c6,bz,c6,bf,c6,bC,c6,cj,c6,b1,c6,cc,c6,bH,c6,b2,c6,be,c6,bR,c6,a5,c6,a3,c6,bA,c6,bJ,c6,bP,c6,bZ,c6,bx,c6,bS,c6,bE,c6,bL,c6,bK,c6,bX,c6,b5,c6,bG,c6,bO,c6,bI,c6,bB,c6,cn,c6,bN,c6,bk,c6,bW,c6,bq,c6,ck,c6,cm,c6,bU,c6,cl,c6,b0,c6,bl,c6,ci,c6,bj,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6,c6];var aG=[c7,c7,cT,c7,cU,c7,a6,c7,a2,c7,ce,c7,br,c7,a1,c7,a4,c7,c7,c7,c7,c7,c7,c7,c7,c7,c7,c7,c7,c7,c7,c7];var aH=[c8,c8,cW,c8,cX,c8,c8,c8];var aI=[c9,c9,cZ,c9,c_,c9,c9,c9];var aJ=[da,da,c0,da,c1,da,da,da];var aK=[db,db,c3,db,c4,db,cr,db];return{_strlen:cv,_free:cu,_memset:cw,_malloc:cs,_memcpy:cx,_calloc:ct,_gbs_close:a9,_gbs_step:a8,_load:cq,runPostSets:a$,stackAlloc:aL,stackSave:aM,stackRestore:aN,setThrew:aO,setTempRet0:aR,setTempRet1:aS,setTempRet2:aT,setTempRet3:aU,setTempRet4:aV,setTempRet5:aW,setTempRet6:aX,setTempRet7:aY,setTempRet8:aZ,setTempRet9:a_,dynCall_vi:cM,dynCall_vii:cP,dynCall_ii:cS,dynCall_viii:cV,dynCall_v:cY,dynCall_iii:c$,dynCall_viiii:c2}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "jsCall": jsCall, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_viiii": invoke_viiii, "_strncmp": _strncmp, "_pwrite": _pwrite, "_sysconf": _sysconf, "_sbrk": _sbrk, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "__reallyNegative": __reallyNegative, "__formatString": __formatString, "_send": _send, "_write": _write, "_llvm_uadd_with_overflow_i16": _llvm_uadd_with_overflow_i16, "_abort": _abort, "_fprintf": _fprintf, "_time": _time, "___errno_location": ___errno_location, "_fflush": _fflush, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _gbs_close = Module["_gbs_close"] = asm["_gbs_close"];
var _gbs_step = Module["_gbs_step"] = asm["_gbs_step"];
var _load = Module["_load"] = asm["_load"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
// === Auto-generated postamble setup entry stuff ===
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      throw e;
    }
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + (new Error().stack);
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
Module.cb_ptr = Runtime.addFunction(function(a,b,c) { Module.io_cb(a,b,c); });
function init(file, io, subsong) {
    if (Module.buf)
	Module._free(Module.buf);
    if (Module.gbs_obj)
	Module.ccall('gbs_close', 'number', ['number'], [Module.gbs_obj]);
    var len = file.length;
    var buf = Module.buf = Module._malloc(len);
    Module.HEAPU8.set(file, buf);
    Module.io_cb = io;
    Module.gbs_obj = Module.ccall('load', 'number', ['number', 'number'], [buf, len, Module.cb_ptr, subsong]);
    return !!Module.gbs_obj;
}
function step(cycles) {
    return Module.ccall('gbs_step', 'number', ['number', 'number'], [Module.gbs_obj, cycles]);
}
return {
    init: init,
    step: step,
    };
}();
