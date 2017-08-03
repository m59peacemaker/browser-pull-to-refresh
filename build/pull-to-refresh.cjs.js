'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var on_1 = createCommonjsModule(function (module) {
const on = (element, eventName, listener, options) => {
  element.addEventListener(eventName, listener, options);
  return () => element.removeEventListener(eventName, listener)
};

module.exports = on;
});

var once_1 = createCommonjsModule(function (module) {
const once = (emitter, name, listener, options) => {
  const off = on_1(emitter, name, (...args) => {
    off();
    return listener(...args)
  }, options);
  return off
};

module.exports = once;
});

var objectify_1 = createCommonjsModule(function (module) {
const objectify = jankyObj => {
  const obj = {};
  for (const key in jankyObj) {
    obj[key] = jankyObj[key];
  }
  return obj
};

module.exports = objectify;
});

var makeTouchEventLikeMouseEvent = createCommonjsModule(function (module) {
const makeLikeMouseEvent = e => {
  const t = objectify_1(e.touches[0]);
  delete t.target;
  return Object.assign(e, t)
};

module.exports = makeLikeMouseEvent;
});

var pointerDown_1 = createCommonjsModule(function (module) {
const event = 'ontouchstart' in window
  ? {
    name: 'touchstart',
    normalize: e => e.touches.length > 1 ? false : makeTouchEventLikeMouseEvent(e)
  }
  : { name: 'mousedown', normalize: e => e };

const pointerDown = (element, listener, options) => {
  return on_1(element, event.name, e => {
    e = event.normalize(e);
    if (e) {
      return listener(e)
    }
  }, options)
};

module.exports = pointerDown;
});

var pointerMove_1 = createCommonjsModule(function (module) {
const event = 'ontouchmove' in window
  ? {
    name: 'touchmove',
    normalize: e => e.touches.length > 1 ? false : makeTouchEventLikeMouseEvent(e)
  }
  : { name: 'mousemove', normalize: e => e };

const pointerMove = (element, listener, options) => {
  return on_1(element, event.name, e => {
    e = event.normalize(e);
    if (e) {
      return listener(e)
    }
  }, options)
};

module.exports = pointerMove;
});

var pointerUp_1 = createCommonjsModule(function (module) {
const event = 'ontouchend' in window
  ? {
    name: 'touchend',
    normalize: e => e.touches.length > 1 ? false : makeTouchEventLikeMouseEvent(e)
  }
  : { name: 'mouseup', normalize: e => e };

const pointerUp = (element, listener, options) => {
  return on_1(element, event.name, e => {
    e = event.normalize(e);
    if (e) {
      return listener(e)
    }
  }, options)
};

module.exports = pointerUp;
});

const style = document.createElement('style');
style.textContent = `::selection { background: transparent; }`;

const selectionVisibility = {
  on: () => { try { document.head.removeChild(style); } catch (err) { } },
  off: () => document.head.appendChild(style)
};

var selectionVisibility_1 = selectionVisibility;

var drag = createCommonjsModule(function (module) {
const noop = () => {};
const when = (predicate, whenTrueFn) => x => predicate(x) ? whenTrueFn(x) : x;
const isUsefulSelection = s => s.toString().trim().length;


// TODO: dealing with text selection while dragging around is pretty awkward, make a good API for it

// TODO: the drag API is not expressive/clear enough.
  // what is "start"? Need "mightStart" (touch) and "passedThreshold"

// TODO: look for performance optimizations and/or simpler code in what browsers need vs mobile
  // right now, both get mostly the same code

const Drag = (element, { start = noop, end = noop, drag = noop, threshold = 0 }) => {
  return pointerDown_1(element, initialE => {
    const sel = window.getSelection();

    if (isUsefulSelection(sel)) {
      // if there is any non-arbitrary selection, it needs to be cleared before dragging will work
      return
    }
    sel.removeAllRanges(); // remove arbitrary selection
    selectionVisibility_1.off();

    let started = false;

    const passedThreshold = e => started
      || Math.abs(initialE.clientX - e.clientX) > threshold
      || Math.abs(initialE.clientY - e.clientY) > threshold;

    const startAndSetStarted = () => {
      started = true;
      selectionVisibility_1.on();
      start(initialE);
    };

    const pointerMoveOff = pointerMove_1(
      /* use the window so that movement beyond the bounds of the element where the drag originated
        will still work */
      window,
      when(
        passedThreshold,
        e => {
          if (!started) { startAndSetStarted(); }
          return drag(e)
        }
      ),
      // must NOT be passive to prevent default, like android chrome's native pull to refresh
      { passive: false }
    );

    let pointerUpOff;
    let windowBlurOff;
    const onUp = e => {
      pointerMoveOff();
      pointerUpOff();
      windowBlurOff();
      return end(e)
    };

    pointerUpOff = pointerUp_1(window, onUp);
    windowBlurOff = on_1(window, 'blur', onUp);

    if (!threshold) {
      return startAndSetStarted()
    }
    // must NOT be passive or android chrome's native pull to refresh causes problems in some cases
      // i.e. element is body with no height
  }, { passive: false })
};

module.exports = Drag;
});

var overflowTopScrollDrag = createCommonjsModule(function (module) {
const noop = () => {};


const getScrollY = node => node === window
  ? node.scrollY
  : node.scrollTop;

// TODO: this would ideally be derived from a drag restricted to the Y axis via a threshold
  // i.e. VerticalDrag(touchElement, etc)
  // for now, this function has to deal with it itself
// TODO: probably all gestures should be handled with streams / async transduce
const threshold = 20;
const OverflowTopScrollDrag = ({
  touchElement,
  scrollableElement,
  onStart = noop,
  onEnd = noop,
  onOverflow
}) => {
  let initialE;
  let lastMove;
  let overflowAmount;
  let isYDrag;

  drag(touchElement, {
    threshold,
    start: e => {
      initialE = e;
      lastMove = e;
      overflowAmount = 0;
      isYDrag = undefined;
      selectionVisibility_1.off();
    },
    end: e => {
      selectionVisibility_1.on();
      return onEnd(e)
    },
    drag: e => {
      if (isYDrag === undefined) {
        isYDrag = Math.abs(e.clientY - initialE.clientY) >= threshold;
        if (isYDrag) {
          onStart(initialE);
        }
      }

      if (!isYDrag) {
        selectionVisibility_1.on();
        return
      }

      if (e.clientY === lastMove.clientY || getScrollY(scrollableElement) !== 0) {
        return
      }

      const delta = e.clientY - lastMove.clientY;
      overflowAmount = Math.max(0, overflowAmount + delta);

      if (overflowAmount) {
        window.getSelection().removeAllRanges();
        e.overflow = { amount: overflowAmount };
        onOverflow(e);
      }

      lastMove = e;
    }
  });
};

module.exports = OverflowTopScrollDrag;
});

function noop() {}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function differs(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function dispatchObservers(component, group, newState, oldState) {
	for (var key in group) {
		if (!(key in newState)) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		if (differs(newValue, oldValue)) {
			var callbacks = group[key];
			if (!callbacks) continue;

			for (var i = 0; i < callbacks.length; i += 1) {
				var callback = callbacks[i];
				if (callback.__calling) continue;

				callback.__calling = true;
				callback.call(component, newValue, oldValue);
				callback.__calling = false;
			}
		}
	}
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function on$1(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function set(newState) {
	this._set(assign({}, newState));
	if (this._root._lock) return;
	this._root._lock = true;
	callAll(this._root._beforecreate);
	callAll(this._root._oncreate);
	callAll(this._root._aftercreate);
	this._root._lock = false;
}

function callAll(fns) {
	while (fns && fns.length) fns.pop()();
}

var proto = {
	get: get,
	fire: fire,
	observe: observe,
	on: on$1,
	set: set
};

function recompute$3 ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'color' in newState && differs( state.color, oldState.color ) ) || ( 'sizeRatio' in newState && differs( state.sizeRatio, oldState.sizeRatio ) ) || ( 'size' in newState && differs( state.size, oldState.size ) ) ) {
		state.styles = newState.styles = template$3.computed.styles( state.color, state.sizeRatio, state.size );
	}
}

var template$3 = (function () {
return {
  data () {
    return {
      size: 44,
      color: '#2196f3',
      sizeRatio: 1
    }
  },

  computed: {
    styles: (color, sizeRatio, size) => {
      sizeRatio = Math.min(1, sizeRatio);
      const maxBorderWidth = size * 0.1364;
      const minBorderWidth = size * 0.05;
      const borderWidthRange = maxBorderWidth - minBorderWidth;
      const borderWidth = minBorderWidth + (sizeRatio * borderWidthRange);

      return {
        borderWidth,
        borderColor: `transparent ${color} transparent transparent`
      }
    }
  }
}

}());

function add_css$3 () {
	var style = createElement( 'style' );
	style.id = 'svelte-3591478532-style';
	style.textContent = "\n\n[svelte-3591478532].arrow-head, [svelte-3591478532] .arrow-head {\n  transform: rotate(-25deg);\n  position: absolute;\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  right: 13%;\n  bottom: -50%;\n  height: 100%;\n  width: 100%;\n}\n\nspan[svelte-3591478532], [svelte-3591478532] span {\n  display: block;\n  width: 0;\n  height: 0;\n  border-style: solid;\n  border-width: 6px;\n}\n\n";
	appendNode( style, document.head );
}

function create_main_fragment$3 ( state, component ) {
	var div, span, span_style_value;

	return {
		create: function () {
			div = createElement( 'div' );
			span = createElement( 'span' );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			setAttribute( div, 'svelte-3591478532', '' );
			div.className = "arrow-head";
			span.style.cssText = span_style_value = "\n      border-color: " + ( state.styles.borderColor ) + ";\n      border-width: " + ( state.styles.borderWidth ) + "px;\n    ";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( span, div );
		},

		update: function ( changed, state ) {
			if ( span_style_value !== ( span_style_value = "\n      border-color: " + ( state.styles.borderColor ) + ";\n      border-width: " + ( state.styles.borderWidth ) + "px;\n    " ) ) {
				span.style.cssText = span_style_value;
			}
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: noop
	};
}

function ArrowHead ( options ) {
	options = options || {};
	this._state = assign( template$3.data(), options.data );
	recompute$3( this._state, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;

	this._torndown = false;
	if ( !document.getElementById( 'svelte-3591478532-style' ) ) add_css$3();

	this._fragment = create_main_fragment$3( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}
}

assign( ArrowHead.prototype, proto );

ArrowHead.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute$3( this._state, newState, oldState, false );
	dispatchObservers( this, this._observers.pre, newState, oldState );
	this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

ArrowHead.prototype.teardown = ArrowHead.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	if ( detach !== false ) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function recompute$2 ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'which' in newState && differs( state.which, oldState.which ) ) || ( 'rotate' in newState && differs( state.rotate, oldState.rotate ) ) ) {
		state.rotateDeg = newState.rotateDeg = template$2.computed.rotateDeg( state.which, state.rotate );
	}

	if ( isInitial || ( 'which' in newState && differs( state.which, oldState.which ) ) || ( 'color' in newState && differs( state.color, oldState.color ) ) || ( 'rotate' in newState && differs( state.rotate, oldState.rotate ) ) ) {
		state.borderColor = newState.borderColor = template$2.computed.borderColor( state.which, state.color, state.rotate );
	}
}

var template$2 = (function () {
const START_OFFSET = {
  right: -136,
  left: -45
};

return {
  data () {
    return {
      which: 'right',
      borderWidth: 3,
      color: '#2196f3',
      rotate: -136
    }
  },

  computed: {
    rotateDeg: (which, rotate) => START_OFFSET[which] + rotate,
    borderColor: (which, color, rotate) => {
      return [
        (which === 'right' && rotate > 22.5) || rotate > 135,
        which === 'right',
        which === 'left' && rotate > 315,
        rotate > 180,
      ].reduce((acc, shouldColor) => `${acc}${shouldColor ? color : 'transparent'} `, '')
    }
  }
}

}());

function add_css$2 () {
	var style = createElement( 'style' );
	style.id = 'svelte-1381413138-style';
	style.textContent = "\n\n[svelte-1381413138].half-circle, [svelte-1381413138] .half-circle {\n  animation-duration: 1.3125s;\n  animation-timing-function: cubic-bezier(0.35, 0, 0.25, 1);\n  animation-iteration-count: infinite; }\n\n[svelte-1381413138].left, [svelte-1381413138] .left,\n[svelte-1381413138].right, [svelte-1381413138] .right {\n  position: absolute;\n  top: 0;\n  height: 100%;\n  width: 50%;\n  overflow: hidden;\n}\n\n[svelte-1381413138].left, [svelte-1381413138] .left {\n  /* The overflow: hidden separating the left and right caused a 1px distortion between them\n     in some browsers. This smooths it out by letting the left overlap the right by 1px\n     The left half circle width has to be reduced by 2px to compensate this 1px overlap\n   */\n  width: calc(50% + 1px);\n}\n\n[svelte-1381413138].right, [svelte-1381413138] .right {\n  right: 0\n}\n\n[svelte-1381413138].half-circle, [svelte-1381413138] .half-circle {\n  height: 100%;\n  width: 200%;\n  position: absolute;\n  top: 0;\n  box-sizing: border-box;\n  border-width: 3px;\n  border-style: solid;\n  border-color: #000 #000 transparent #000;\n  border-radius: 50%;\n}\n\n[svelte-1381413138].left .half-circle, [svelte-1381413138] .left .half-circle {\n  /* compensate the 1px overlap so that the circle remains the correct size and shape\n     see comment on .left\n   */\n  width: calc(200% - 2px);\n\n  border-right-color: transparent;\n}\n\n[svelte-1381413138].right .half-circle, [svelte-1381413138] .right .half-circle {\n  right: 0;\n  border-left-color: transparent;\n}\n\n";
	appendNode( style, document.head );
}

function create_main_fragment$2 ( state, component ) {
	var div, div_class_value, div_1, div_1_style_value;

	return {
		create: function () {
			div = createElement( 'div' );
			div_1 = createElement( 'div' );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			setAttribute( div, 'svelte-1381413138', '' );
			div.className = div_class_value = "side " + ( state.which );
			div_1.className = "half-circle";
			div_1.style.cssText = div_1_style_value = "\n      transform: rotate(" + ( state.rotateDeg ) + "deg);\n      border-width: " + ( state.borderWidth ) + "px;\n      border-color: " + ( state.borderColor ) + ";\n    ";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( div_1, div );
		},

		update: function ( changed, state ) {
			if ( div_class_value !== ( div_class_value = "side " + ( state.which ) ) ) {
				div.className = div_class_value;
			}

			if ( div_1_style_value !== ( div_1_style_value = "\n      transform: rotate(" + ( state.rotateDeg ) + "deg);\n      border-width: " + ( state.borderWidth ) + "px;\n      border-color: " + ( state.borderColor ) + ";\n    " ) ) {
				div_1.style.cssText = div_1_style_value;
			}
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: noop
	};
}

function ArrowSide ( options ) {
	options = options || {};
	this._state = assign( template$2.data(), options.data );
	recompute$2( this._state, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;

	this._torndown = false;
	if ( !document.getElementById( 'svelte-1381413138-style' ) ) add_css$2();

	this._fragment = create_main_fragment$2( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}
}

assign( ArrowSide.prototype, proto );

ArrowSide.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute$2( this._state, newState, oldState, false );
	dispatchObservers( this, this._observers.pre, newState, oldState );
	this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

ArrowSide.prototype.teardown = ArrowSide.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	if ( detach !== false ) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function recompute$1 ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'progressRatio' in newState && differs( state.progressRatio, oldState.progressRatio ) ) ) {
		state.rotate = newState.rotate = template$1.computed.rotate( state.progressRatio );
	}

	if ( isInitial || ( 'size' in newState && differs( state.size, oldState.size ) ) ) {
		state.borderWidth = newState.borderWidth = template$1.computed.borderWidth( state.size );
	}
}

var template$1 = (function () {
const COMPLETE_ROTATION = 270;

return {
  data () {
    return {
      size: 44,
      color: '#2196f3',
      progressRatio: 1
    }
  },

  computed: {
    rotate: progressRatio => COMPLETE_ROTATION * progressRatio,
    borderWidth: size => size * 0.0682
  }
}
}());

function add_css$1 () {
	var style = createElement( 'style' );
	style.id = 'svelte-1901924645-style';
	style.textContent = "\n\n[svelte-1901924645].arrow, [svelte-1901924645] .arrow {\n  position: relative;\n  height: 100%;\n}\n\n[svelte-1901924645].arrow-head-rotate, [svelte-1901924645] .arrow-head-rotate {\n  height: 100%;\n  width: 100%;\n}\n\n";
	appendNode( style, document.head );
}

function create_main_fragment$1 ( state, component ) {
	var div, div_style_value, text, text_1;

	var arrowside = new ArrowSide({
		_root: component._root,
		data: {
			which: "left",
			color: state.color,
			rotate: state.rotate,
			borderWidth: state.borderWidth
		}
	});

	var arrowside_1 = new ArrowSide({
		_root: component._root,
		data: {
			which: "right",
			color: state.color,
			rotate: state.rotate,
			borderWidth: state.borderWidth
		}
	});

	var if_block = (state.progressRatio > 0.3) && create_if_block$1( state, component );

	return {
		create: function () {
			div = createElement( 'div' );
			arrowside._fragment.create();
			text = createText( "\n  " );
			arrowside_1._fragment.create();
			text_1 = createText( "\n  " );
			if ( if_block ) if_block.create();
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			setAttribute( div, 'svelte-1901924645', '' );
			div.className = "arrow";
			div.style.cssText = div_style_value = "transform: rotate(90deg); opacity: " + ( state.progressRatio ) + ";";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			arrowside._fragment.mount( div, null );
			appendNode( text, div );
			arrowside_1._fragment.mount( div, null );
			appendNode( text_1, div );
			if ( if_block ) if_block.mount( div, null );
		},

		update: function ( changed, state ) {
			if ( div_style_value !== ( div_style_value = "transform: rotate(90deg); opacity: " + ( state.progressRatio ) + ";" ) ) {
				div.style.cssText = div_style_value;
			}

			var arrowside_changes = {};

			if ( 'color' in changed ) arrowside_changes.color = state.color;
			if ( 'rotate' in changed ) arrowside_changes.rotate = state.rotate;
			if ( 'borderWidth' in changed ) arrowside_changes.borderWidth = state.borderWidth;

			if ( Object.keys( arrowside_changes ).length ) arrowside.set( arrowside_changes );

			var arrowside_1_changes = {};

			if ( 'color' in changed ) arrowside_1_changes.color = state.color;
			if ( 'rotate' in changed ) arrowside_1_changes.rotate = state.rotate;
			if ( 'borderWidth' in changed ) arrowside_1_changes.borderWidth = state.borderWidth;

			if ( Object.keys( arrowside_1_changes ).length ) arrowside_1.set( arrowside_1_changes );

			if ( state.progressRatio > 0.3 ) {
				if ( if_block ) {
					if_block.update( changed, state );
				} else {
					if_block = create_if_block$1( state, component );
					if_block.create();
					if_block.mount( div, null );
				}
			} else if ( if_block ) {
				if_block.unmount();
				if_block.destroy();
				if_block = null;
			}
		},

		unmount: function () {
			detachNode( div );
			if ( if_block ) if_block.unmount();
		},

		destroy: function () {
			arrowside.destroy( false );
			arrowside_1.destroy( false );
			if ( if_block ) if_block.destroy();
		}
	};
}

function create_if_block$1 ( state, component ) {
	var div, div_style_value;

	var arrowhead = new ArrowHead({
		_root: component._root,
		data: {
			size: state.size,
			sizeRatio: (state.progressRatio - 0.3) / 0.7
		}
	});

	return {
		create: function () {
			div = createElement( 'div' );
			arrowhead._fragment.create();
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			div.className = "arrow-head-rotate";
			div.style.cssText = div_style_value = "transform: rotate(" + ( state.rotate - 136 ) + "deg);";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			arrowhead._fragment.mount( div, null );
		},

		update: function ( changed, state ) {
			if ( div_style_value !== ( div_style_value = "transform: rotate(" + ( state.rotate - 136 ) + "deg);" ) ) {
				div.style.cssText = div_style_value;
			}

			var arrowhead_changes = {};

			if ( 'size' in changed ) arrowhead_changes.size = state.size;
			if ( 'progressRatio' in changed ) arrowhead_changes.sizeRatio = (state.progressRatio - 0.3) / 0.7;

			if ( Object.keys( arrowhead_changes ).length ) arrowhead.set( arrowhead_changes );
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: function () {
			arrowhead.destroy( false );
		}
	};
}

function Arrow ( options ) {
	options = options || {};
	this._state = assign( template$1.data(), options.data );
	recompute$1( this._state, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;

	this._torndown = false;
	if ( !document.getElementById( 'svelte-1901924645-style' ) ) add_css$1();

	if ( !options._root ) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment$1( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}

	if ( !options._root ) {
		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign( Arrow.prototype, proto );

Arrow.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute$1( this._state, newState, oldState, false );
	dispatchObservers( this, this._observers.pre, newState, oldState );
	this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

Arrow.prototype.teardown = Arrow.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	if ( detach !== false ) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function recompute$5 ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'which' in newState && differs( state.which, oldState.which ) ) || ( 'color' in newState && differs( state.color, oldState.color ) ) ) {
		state.borderColor = newState.borderColor = template$5.computed.borderColor( state.which, state.color );
	}

	if ( isInitial || ( 'initialProgress' in newState && differs( state.initialProgress, oldState.initialProgress ) ) ) {
		state.animationOffset = newState.animationOffset = template$5.computed.animationOffset( state.initialProgress );
	}
}

var template$5 = (function () {
const MAIN_DURATION = 2.91667;
const ANIMATION_DURATION = 1.3125;
const SYNC_MOD = MAIN_DURATION / ANIMATION_DURATION;

return {
  data () {
    return {
      which: 'left',
      borderWidth: 3,
      color: '#2196f3',
      animated: true,
      initialProgress: 0
    }
  },

  computed: {
    borderColor: (which, color) => {
      const colorIf = side => which === side ? color : 'transparent';
      return `${color} ${colorIf('right')} transparent ${colorIf('left')}`
    },
    animationOffset: initialProgress => {
      if (!initialProgress) { return 0 }
      return -((ANIMATION_DURATION * 1.1) * SYNC_MOD)
    }
  }
}

}());

function add_css$5 () {
	var style = createElement( 'style' );
	style.id = 'svelte-2260197762-style';
	style.textContent = "\n\n@keyframes svelte-2260197762-left-expand {\n  0%, 100% { transform: rotate(125deg); }\n  50%      { transform: rotate(-5deg); }\n}\n\n@keyframes svelte-2260197762-right-expand {\n  0%, 100% { transform: rotate(-125deg); }\n  50%      { transform: rotate(5deg); }\n}\n\n[svelte-2260197762].left .half-circle.animated, [svelte-2260197762] .left .half-circle.animated {\n  animation-name: svelte-2260197762-left-expand;\n}\n\n[svelte-2260197762].right .half-circle.animated, [svelte-2260197762] .right .half-circle.animated {\n  animation-name: svelte-2260197762-right-expand;\n}\n\n[svelte-2260197762].half-circle, [svelte-2260197762] .half-circle {\n  animation-duration: 1.3125s;\n  animation-timing-function: cubic-bezier(0.35, 0, 0.25, 1);\n  animation-iteration-count: infinite; }\n\n[svelte-2260197762].left, [svelte-2260197762] .left,\n[svelte-2260197762].right, [svelte-2260197762] .right {\n  position: absolute;\n  top: 0;\n  height: 100%;\n  width: 50%;\n  overflow: hidden;\n}\n\n[svelte-2260197762].left, [svelte-2260197762] .left {\n  /* The overflow: hidden separating the left and right caused a 1px distortion between them\n     in some browsers. This smooths it out by letting the left overlap the right by 1px\n     The left half circle width has to be reduced by 2px to compensate this 1px overlap\n   */\n  width: calc(50% + 1px);\n}\n\n[svelte-2260197762].right, [svelte-2260197762] .right {\n  right: 0\n}\n\n[svelte-2260197762].half-circle, [svelte-2260197762] .half-circle {\n  height: 100%;\n  width: 200%;\n  position: absolute;\n  top: 0;\n  box-sizing: border-box;\n  border-width: 3px;\n  border-style: solid;\n  border-color: #000 #000 transparent #000;\n  border-radius: 50%;\n}\n\n[svelte-2260197762].left .half-circle, [svelte-2260197762] .left .half-circle {\n  /* compensate the 1px overlap so that the circle remains the correct size and shape\n     see comment on .left\n   */\n  width: calc(200% - 2px);\n\n  border-right-color: transparent;\n}\n\n[svelte-2260197762].right .half-circle, [svelte-2260197762] .right .half-circle {\n  right: 0;\n  border-left-color: transparent;\n}\n\n";
	appendNode( style, document.head );
}

function create_main_fragment$5 ( state, component ) {
	var div, div_class_value, div_1, div_1_class_value, div_1_style_value;

	return {
		create: function () {
			div = createElement( 'div' );
			div_1 = createElement( 'div' );
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			setAttribute( div, 'svelte-2260197762', '' );
			div.className = div_class_value = "side " + ( state.which );
			div_1.className = div_1_class_value = "half-circle " + ( state.animated ? 'animated' : '' );
			div_1.style.cssText = div_1_style_value = "\n      border-width: " + ( state.borderWidth ) + "px;\n      border-color: " + ( state.borderColor ) + ";\n      animation-delay: " + ( state.animationOffset ) + "s;\n    ";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( div_1, div );
		},

		update: function ( changed, state ) {
			if ( div_class_value !== ( div_class_value = "side " + ( state.which ) ) ) {
				div.className = div_class_value;
			}

			if ( div_1_class_value !== ( div_1_class_value = "half-circle " + ( state.animated ? 'animated' : '' ) ) ) {
				div_1.className = div_1_class_value;
			}

			if ( div_1_style_value !== ( div_1_style_value = "\n      border-width: " + ( state.borderWidth ) + "px;\n      border-color: " + ( state.borderColor ) + ";\n      animation-delay: " + ( state.animationOffset ) + "s;\n    " ) ) {
				div_1.style.cssText = div_1_style_value;
			}
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: noop
	};
}

function SpinnerSide ( options ) {
	options = options || {};
	this._state = assign( template$5.data(), options.data );
	recompute$5( this._state, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;

	this._torndown = false;
	if ( !document.getElementById( 'svelte-2260197762-style' ) ) add_css$5();

	this._fragment = create_main_fragment$5( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}
}

assign( SpinnerSide.prototype, proto );

SpinnerSide.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute$5( this._state, newState, oldState, false );
	dispatchObservers( this, this._observers.pre, newState, oldState );
	this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

SpinnerSide.prototype.teardown = SpinnerSide.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	if ( detach !== false ) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function recompute$4 ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'size' in newState && differs( state.size, oldState.size ) ) ) {
		state.borderWidth = newState.borderWidth = template$4.computed.borderWidth( state.size );
	}

	if ( isInitial || ( 'initialProgress' in newState && differs( state.initialProgress, oldState.initialProgress ) ) ) {
		state.animationOffset = newState.animationOffset = template$4.computed.animationOffset( state.initialProgress );
	}
}

var template$4 = (function () {
const ANIMATION_DURATION = 2.91667;

return {
  data () {
    return {
      size: 44,
      color: '#2196f3',
      // this is just serving as a boolean now, needs refactor
        // it just makes the animations start out in a state where the circle is fully expanded
        // and the open space is at the bottom, and is just about to collapse
        // this makes it easy to sync using the arrow-sync-container
      initialProgress: 0
    }
  },

  computed: {
    borderWidth: size => size * 0.0682,
    animationOffset: initialProgress => {
      if (!initialProgress) { return 0 }
      return -(ANIMATION_DURATION * 1.1)
    }
  }
}
}());

function add_css$4 () {
	var style = createElement( 'style' );
	style.id = 'svelte-2520639675-style';
	style.textContent = "\n\n@keyframes svelte-2520639675-outer-rotate {\n  100% { transform: rotate(360deg); }\n}\n\n@keyframes svelte-2520639675-inner-rotate {\n  12.5% { transform: rotate(135deg); }\n  25%   { transform: rotate(270deg); }\n  37.5% { transform: rotate(405deg); }\n  50%   { transform: rotate(540deg); }\n  62.5% { transform: rotate(675deg); }\n  75%   { transform: rotate(810deg); }\n  87.5% { transform: rotate(945deg); }\n  100%  { transform: rotate(1080deg); }\n}\n\n[svelte-2520639675].spinner.animated, [svelte-2520639675] .spinner.animated {\n  animation: svelte-2520639675-outer-rotate 2.91667s linear infinite;\n}\n\n[svelte-2520639675].inner.animated, [svelte-2520639675] .inner.animated {\n  animation: svelte-2520639675-inner-rotate 5.25s cubic-bezier(0.35, 0, 0.25, 1) infinite;\n}\n\n[svelte-2520639675].spinner, [svelte-2520639675] .spinner {\n  width: 100%;\n  height: 100%;\n  position: relative;\n}\n\n[svelte-2520639675].inner, [svelte-2520639675] .inner {\n  height: 100%;\n}\n\n";
	appendNode( style, document.head );
}

function create_main_fragment$4 ( state, component ) {
	var div, div_style_value, div_1, div_1_style_value, text;

	var spinnerside = new SpinnerSide({
		_root: component._root,
		data: {
			which: "left",
			color: state.color,
			borderWidth: state.borderWidth,
			initialProgress: state.initialProgress
		}
	});

	var spinnerside_1 = new SpinnerSide({
		_root: component._root,
		data: {
			which: "right",
			color: state.color,
			borderWidth: state.borderWidth,
			initialProgress: state.initialProgress
		}
	});

	return {
		create: function () {
			div = createElement( 'div' );
			div_1 = createElement( 'div' );
			spinnerside._fragment.create();
			text = createText( "\n    " );
			spinnerside_1._fragment.create();
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			setAttribute( div, 'svelte-2520639675', '' );
			div.className = "spinner animated";
			div.style.cssText = div_style_value = "animation-delay: " + ( state.animationOffset ) + "s;";
			div_1.className = "inner animated";
			div_1.style.cssText = div_1_style_value = "animation-delay: " + ( state.animationOffset ) + "s;";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			appendNode( div_1, div );
			spinnerside._fragment.mount( div_1, null );
			appendNode( text, div_1 );
			spinnerside_1._fragment.mount( div_1, null );
		},

		update: function ( changed, state ) {
			if ( div_style_value !== ( div_style_value = "animation-delay: " + ( state.animationOffset ) + "s;" ) ) {
				div.style.cssText = div_style_value;
			}

			if ( div_1_style_value !== ( div_1_style_value = "animation-delay: " + ( state.animationOffset ) + "s;" ) ) {
				div_1.style.cssText = div_1_style_value;
			}

			var spinnerside_changes = {};

			if ( 'color' in changed ) spinnerside_changes.color = state.color;
			if ( 'borderWidth' in changed ) spinnerside_changes.borderWidth = state.borderWidth;
			if ( 'initialProgress' in changed ) spinnerside_changes.initialProgress = state.initialProgress;

			if ( Object.keys( spinnerside_changes ).length ) spinnerside.set( spinnerside_changes );

			var spinnerside_1_changes = {};

			if ( 'color' in changed ) spinnerside_1_changes.color = state.color;
			if ( 'borderWidth' in changed ) spinnerside_1_changes.borderWidth = state.borderWidth;
			if ( 'initialProgress' in changed ) spinnerside_1_changes.initialProgress = state.initialProgress;

			if ( Object.keys( spinnerside_1_changes ).length ) spinnerside_1.set( spinnerside_1_changes );
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: function () {
			spinnerside.destroy( false );
			spinnerside_1.destroy( false );
		}
	};
}

function Spinner ( options ) {
	options = options || {};
	this._state = assign( template$4.data(), options.data );
	recompute$4( this._state, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;

	this._torndown = false;
	if ( !document.getElementById( 'svelte-2520639675-style' ) ) add_css$4();

	if ( !options._root ) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment$4( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}

	if ( !options._root ) {
		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign( Spinner.prototype, proto );

Spinner.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute$4( this._state, newState, oldState, false );
	dispatchObservers( this, this._observers.pre, newState, oldState );
	this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

Spinner.prototype.teardown = Spinner.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	if ( detach !== false ) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function recompute ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'progressRatio' in newState && differs( state.progressRatio, oldState.progressRatio ) ) ) {
		state.spinning = newState.spinning = template.computed.spinning( state.progressRatio );
	}

	if ( isInitial || ( 'size' in newState && differs( state.size, oldState.size ) ) ) {
		state.padding = newState.padding = template.computed.padding( state.size );
	}

	if ( isInitial || ( 'spinning' in newState && differs( state.spinning, oldState.spinning ) ) || ( 'lastProgressRatio' in newState && differs( state.lastProgressRatio, oldState.lastProgressRatio ) ) ) {
		state.arrowSyncRotate = newState.arrowSyncRotate = template.computed.arrowSyncRotate( state.spinning, state.lastProgressRatio );
	}
}

var template = (function () {
return {
  data () {
    return {
      size: 44,
      progressRatio: undefined,
      lastProgressRatio: 0
    }
  },

  computed: {
    spinning: progressRatio => progressRatio === undefined,
    padding: size => Math.floor(size * 0.2046),
    arrowSyncRotate: (spinning, lastProgressRatio) => {
      const ratio = !spinning ? 0 : (lastProgressRatio || 0);
      return ratio * 270
    }
  },

  oncreate () {
    this.observe('progressRatio', (newValue, oldValue) => this.set({ lastProgressRatio: oldValue }));
  }
}
}());

function add_css () {
	var style = createElement( 'style' );
	style.id = 'svelte-944197787-style';
	style.textContent = "\n\n[svelte-944197787].refresh-indicator, [svelte-944197787] .refresh-indicator {\n  box-sizing: border-box;\n  width: 44px;\n  height: 44px;\n  padding: 9px;\n  border-radius: 50%;\n  background-color: #fff;\n  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.3);\n  overflow: hidden;\n}\n\n[svelte-944197787].arrow-sync-container, [svelte-944197787] .arrow-sync-container {\n  height: 100%;\n}\n\n";
	appendNode( style, document.head );
}

function create_main_fragment ( state, component ) {
	var div, div_style_value;

	function get_block ( state ) {
		if ( state.spinning ) return create_if_block;
		return create_if_block_1;
	}

	var current_block = get_block( state );
	var if_block = current_block( state, component );

	return {
		create: function () {
			div = createElement( 'div' );
			if_block.create();
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			setAttribute( div, 'svelte-944197787', '' );
			div.className = "refresh-indicator";
			div.style.cssText = div_style_value = "height: " + ( state.size ) + "px; width: " + ( state.size ) + "px; padding: " + ( state.padding ) + "px;";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			if_block.mount( div, null );
		},

		update: function ( changed, state ) {
			if ( div_style_value !== ( div_style_value = "height: " + ( state.size ) + "px; width: " + ( state.size ) + "px; padding: " + ( state.padding ) + "px;" ) ) {
				div.style.cssText = div_style_value;
			}

			if ( current_block === ( current_block = get_block( state ) ) && if_block ) {
				if_block.update( changed, state );
			} else {
				if_block.unmount();
				if_block.destroy();
				if_block = current_block( state, component );
				if_block.create();
				if_block.mount( div, null );
			}
		},

		unmount: function () {
			detachNode( div );
			if_block.unmount();
		},

		destroy: function () {
			if_block.destroy();
		}
	};
}

function create_if_block ( state, component ) {
	var div, div_style_value;

	var spinner = new Spinner({
		_root: component._root,
		data: {
			size: state.size,
			initialProgress: state.lastProgressRatio
		}
	});

	return {
		create: function () {
			div = createElement( 'div' );
			spinner._fragment.create();
			this.hydrate();
		},

		hydrate: function ( nodes ) {
			div.className = "arrow-sync-container";
			div.style.cssText = div_style_value = "transform: rotate(" + ( state.arrowSyncRotate ) + "deg);";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			spinner._fragment.mount( div, null );
		},

		update: function ( changed, state ) {
			if ( div_style_value !== ( div_style_value = "transform: rotate(" + ( state.arrowSyncRotate ) + "deg);" ) ) {
				div.style.cssText = div_style_value;
			}

			var spinner_changes = {};

			if ( 'size' in changed ) spinner_changes.size = state.size;
			if ( 'lastProgressRatio' in changed ) spinner_changes.initialProgress = state.lastProgressRatio;

			if ( Object.keys( spinner_changes ).length ) spinner.set( spinner_changes );
		},

		unmount: function () {
			detachNode( div );
		},

		destroy: function () {
			spinner.destroy( false );
		}
	};
}

function create_if_block_1 ( state, component ) {

	var arrow = new Arrow({
		_root: component._root,
		data: {
			size: state.size,
			progressRatio: state.progressRatio
		}
	});

	return {
		create: function () {
			arrow._fragment.create();
		},

		mount: function ( target, anchor ) {
			arrow._fragment.mount( target, anchor );
		},

		update: function ( changed, state ) {
			var arrow_changes = {};

			if ( 'size' in changed ) arrow_changes.size = state.size;
			if ( 'progressRatio' in changed ) arrow_changes.progressRatio = state.progressRatio;

			if ( Object.keys( arrow_changes ).length ) arrow.set( arrow_changes );
		},

		unmount: function () {
			arrow._fragment.unmount();
		},

		destroy: function () {
			arrow.destroy( false );
		}
	};
}

function Indicator ( options ) {
	options = options || {};
	this._state = assign( template.data(), options.data );
	recompute( this._state, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root || this;
	this._yield = options._yield;

	this._torndown = false;
	if ( !document.getElementById( 'svelte-944197787-style' ) ) add_css();

	var oncreate = template.oncreate.bind( this );

	if ( !options._root ) {
		this._oncreate = [oncreate];
		this._beforecreate = [];
		this._aftercreate = [];
	} else {
	 	this._root._oncreate.push(oncreate);
	 }

	this._fragment = create_main_fragment( this._state, this );

	if ( options.target ) {
		this._fragment.create();
		this._fragment.mount( options.target, null );
	}

	if ( !options._root ) {
		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign( Indicator.prototype, proto );

Indicator.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute( this._state, newState, oldState, false );
	dispatchObservers( this, this._observers.pre, newState, oldState );
	this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

Indicator.prototype.teardown = Indicator.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	if ( detach !== false ) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};




var Indicator_es = Object.freeze({
	default: Indicator
});

var RefreshIndicator = ( Indicator_es && Indicator ) || Indicator_es;

var indicator = createCommonjsModule(function (module) {
const Indicator = () => {
  const node = document.createElement('div');
  const indicator = new RefreshIndicator({ target: node });

  const setTilRefreshRatio = ratio => indicator.set({ progressRatio: ratio });
  const setRefreshing = isRefreshing => isRefreshing && indicator.set({ progressRatio: undefined });

  return {
    node,
    height: 50,
    setTilRefreshRatio,
    setRefreshing
  }
};

module.exports = Indicator;
});

var index = createCommonjsModule(function (module) {
// TODO: make `indicator` an option but include a default in this repo, but imported separate
// TODO: determine if drag is a pull-to-refresh or text selection asap, then gate off the other
// TODO: use svelte
// TODO: don't touch/modify/style the indicator at all, use a wrapper
// TODO: add pull resistance modifier

const Spacer = height => {
  const node = document.createElement('div');
  node.style.height = `${height}px`;
  return node
};

const IndicatorDisplay = ({ indicator: indicator$$1, distanceToRefresh, extraPullDistance, threshold }) => {
  const maxPullHeight = distanceToRefresh + extraPullDistance;
  indicator$$1.node.style.display = 'inline-block';

  const node = document.createElement('div');
  node.appendChild(indicator$$1.node);
  node.appendChild(Spacer(maxPullHeight));
  node.style.pointerEvents = 'none';
  node.style.overflow = 'hidden';
  node.style.textAlign = 'center';
  node.style.position = 'absolute';
  node.style.top = 0;
  node.style.left = 0;
  node.style.right = 0;

  const restingY = -(indicator$$1.height + threshold);
  let indicatorY;
  const placeIndicator = (y, { smooth = false } = {}) => {
    y = Math.max(y, 0);

    if (indicatorY === y) { return }

    indicatorY = y;

    if (smooth) {
      indicator$$1.node.style.transition = 'transform 300ms';
      once_1(indicator$$1.node, 'transitionend', () => {
        indicator$$1.node.style.transition = null;
      });
    }

    const maxY = indicator$$1.height + maxPullHeight;
    const adjustedY = restingY + Math.min(y, maxY);
    const scale = y === 0 ? 0 : 1; //Math.min(1, y / maxY)
    indicator$$1.node.style.transform = `translateY(${adjustedY}px) scale(${scale})`;
  };

  placeIndicator(0);

  return {
    node,
    placeIndicator
  }
};

const pullToRefresh = ({
  element,
  distanceToRefresh = 40,
  extraPullDistance = 20,
  threshold = 10,
  onRefresh
}) => {
  const indicator$$1 = indicator();

  // I hate having to do this...
  // maybe it should be required that the consumer code does this instead of hiding it in here
  element.style.position = 'relative';

  const indicatorDisplay = IndicatorDisplay({
    indicator: indicator$$1,
    distanceToRefresh,
    extraPullDistance,
    threshold
  });

  element.appendChild(indicatorDisplay.node);

  const refreshAt = distanceToRefresh + indicator$$1.height;
  let refreshing = false;
  let pullAmount = 0;

  overflowTopScrollDrag({
    touchElement: element,
    scrollableElement: window,
    threshold,
    onStart: () => {
      indicator$$1.node.style.transition = null;
    },
    onEnd: () => {
      indicator$$1.setRefreshing(true);
      Promise.resolve(pullAmount >= refreshAt ? onRefresh() : undefined)
        .then(() => {
          indicator$$1.setRefreshing(false);
          indicatorDisplay.placeIndicator(0, { smooth: true });
        });
    },
    onOverflow: e => {
      e.preventDefault();
      pullAmount = e.overflow.amount;
      indicator$$1.setTilRefreshRatio(pullAmount / refreshAt);
      indicatorDisplay.placeIndicator(pullAmount);
    }
  });
};

module.exports = pullToRefresh;
});

module.exports = index;
