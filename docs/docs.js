(function () {
'use strict';

function nop$1(){}

var index = nop$1;

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var supportsCaptureOption_1 = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var supportsCaptureOption = false;
try {
  var opts = Object.defineProperty({}, 'capture', {
    get: function get() {
      supportsCaptureOption = true;
    }
  });
  window.addEventListener('test', null, opts);
} catch (e) {
  //ignore
}

exports.default = supportsCaptureOption;
module.exports = exports['default'];

});

var index$1 = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.addEventListener = addEventListener;
exports.removeEventListener = removeEventListener;



var _supportsCaptureOption2 = _interopRequireDefault(supportsCaptureOption_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addEventListener(target, type, handler, options, wantsUntrusted) {
  var optionsOrCapture = _supportsCaptureOption2.default || !options || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' ? options : !!options.capture;
  target.addEventListener(type, handler, optionsOrCapture, wantsUntrusted);
}

function removeEventListener(target, type, handler, options) {
  var optionsOrCapture = _supportsCaptureOption2.default || !options || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' ? options : !!options.capture;
  target.removeEventListener(type, handler, optionsOrCapture);
}

});

var index_1 = index$1.addEventListener;
var index_2 = index$1.removeEventListener;

var addEventListener = (element, name, listener, options) => {
  index_1(element, name, listener, options);
  return () => index_2(element, name, listener, options)
};

const ontouchpan = ({
  element,
  onpanstart,
  onpanmove,
  onpanend,
  threshold = 0,
  passive
}) => {
  passive = Object.assign({
    touchstart: true,
    touchmove: true
  }, passive);

  let firstTouch, lastMove, started;

  const findTouch = e => Array.prototype.slice.call(e.changedTouches)
    .filter(touch => touch.identifier === firstTouch.identifier)
    [0];

  const decorateEvent = (e, touch) => {
    const distanceX = touch.clientX - firstTouch.clientX;
    const distanceY = touch.clientY - firstTouch.clientY;
    const deltaX = distanceX - lastMove.distanceX;
    const deltaY = distanceY - lastMove.distanceY;
    Object.assign(e, { distanceX, distanceY, deltaX, deltaY });
  };

  const passedThreshold = e => Math.abs(e.distanceY) > threshold || Math.abs(e.distanceX) > threshold;

  const touchstart = e => {
    started = false;
    firstTouch = e.changedTouches[0];
    lastMove = Object.assign(e, { distanceX: 0, distanceY: 0 });
  };

  const touchmove = e => {
    const touch = findTouch(e);

    if (!touch) { return }

    decorateEvent(e, touch);
    lastMove = e;

    if (!started && passedThreshold(e)) {
      onpanstart && onpanstart(e);
      started = true;
    }

    if (started) {
      onpanmove && onpanmove(e);
    }
  };

  const touchend = e => {
    if (findTouch(e)) {
      onpanend && onpanend(e);
    }
  };

  const offs = [
    addEventListener(element, 'touchstart', touchstart, { passive: passive.touchstart }),
    onpanmove ? addEventListener(window, 'touchmove', touchmove, { passive: passive.touchmove }) : nop,
    onpanend ? addEventListener(window, 'touchend', touchend) : nop
  ];

  return () => offs.forEach(off => off())
};

// TODO: on iOS can/should the scroll event be used instead of touch?
// TODO: maybe add `aggressive` option to determine whether window has to be scrolled to top to start
  // when touch starts
  // most native apps with pull to refresh are like this, but it isn't good for mobile browsers that have the url bar that hides when scrolling down
  // aggressive: true means that the pull to refresh will start even if the page was scrolled down when the touch began, if the touchmove causes a scroll to the top and then begins overscroll
  // in code, simply skip the pageYOffset check
const pullToRefresh = ({
  indicator,
  onRefresh = () => Promise.resolve(),
  element = document.body
}) => {
  const {
    distanceToRefresh = indicator.height || 60,
    progressOffset = 0,
    maxOverscroll = Infinity,
    elasticOverscroll = false,
    onPullStart = index,
    onPullMove = index,
    onPullCancel = index,
    onRefreshStart = index,
    onRefreshEnd = index
  } = indicator;

  const offsetDistanceToRefresh = distanceToRefresh - progressOffset;
  let pulling, busy, tilRefreshRatio, initialScrollTop, lastOverscroll, canBePtr;

  const reset = () => {
    canBePtr = false;
    pulling = false;
    busy = false;
    tilRefreshRatio = 0;
    lastOverscroll = 0;
  };

  const calcOverscrollAmount = e => {
    return -(elasticOverscroll ? element.scrollTop : initialScrollTop - e.distanceY)
  };

  const refresh = () => {
    onRefreshStart();
    return onRefresh()
      .then(() => onRefreshEnd())
  };

  // TODO: this doesn't filter out left/right motions
    // I like the idea of having a threshold that needs to be crossed on the Y axis before X axis in order to be counted as a pull
    // though this is irrelevant in elasticOverscroll situations
  const end = ontouchpan({
    element,
    passive: {
      touchstart: true,
      touchmove: elasticOverscroll
    },
    onpanstart: e => {
      if (busy || pulling) { return }

      /* canBePtr also serves to gate off the case where a touch starts while busy,
           then the busy state completes, then a move occurs
      */
      canBePtr = elasticOverscroll || window.pageYOffset === 0;
      lastOverscroll = 0;
      initialScrollTop = element.scrollTop;
    },
    onpanmove: e => {
      const unrestrainedOverscrollDistance = calcOverscrollAmount(e);
      const overscrollDistance = Math.min(maxOverscroll, unrestrainedOverscrollDistance);
      const isPtr = !busy
        && overscrollDistance > 0
        && canBePtr;

      if (!isPtr) {
        return
      }

      if (!pulling) {
        onPullStart({ target: element });
        pulling = true;
      }

      if (!elasticOverscroll) {
        // stop pan up from scrolling the page
        e.preventDefault();
      }

      const extraOverscroll = unrestrainedOverscrollDistance - overscrollDistance;
      initialScrollTop += extraOverscroll;

      const tilRefreshDistance = distanceToRefresh - overscrollDistance;
      tilRefreshRatio = (offsetDistanceToRefresh - tilRefreshDistance)
        / offsetDistanceToRefresh;

      const overscrollDelta = overscrollDistance - lastOverscroll;
      lastOverscroll = overscrollDistance;

      onPullMove({
        tilRefreshRatio,
        tilRefreshDistance,
        overscrollDistance,
        overscrollDelta
      });
    },
    onpanend: () => {
      // the `busy` check here is likely redundant, just being safe
      if (!pulling || busy) { return }
      pulling = false;
      busy = true

      ;(tilRefreshRatio >= 1
        ? refresh()
        : Promise.resolve(onPullCancel())
      )
        .then(reset)
        .catch(err => {
          reset();
          throw err
        });
    }
  });

  return {
    end,
    refresh
  }
};

function noop$1() {}

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

function on(eventName, handler) {
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
	on: on,
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
      size = size * 1.692;
      sizeRatio = Math.min(1, sizeRatio);
      const maxBorderWidth = size * 0.1364;
      const minBorderWidth = size * 0.05;
      const borderWidthRange = maxBorderWidth - minBorderWidth;
      const borderWidth = Math.round( minBorderWidth + (sizeRatio * borderWidthRange) );

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
	style.id = 'svelte-4267355228-style';
	style.textContent = "\n\n[svelte-4267355228].arrow-head, [svelte-4267355228] .arrow-head {\n  transform: rotate(-25deg);\n  position: absolute;\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  right: 13%;\n  bottom: -50%;\n  height: 100%;\n  width: 100%;\n}\n\nspan[svelte-4267355228], [svelte-4267355228] span {\n  display: block;\n  width: 0;\n  height: 0;\n  border-style: solid;\n  border-width: 6px;\n}\n\n";
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
			setAttribute( div, 'svelte-4267355228', '' );
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

		destroy: noop$1
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
	if ( !document.getElementById( 'svelte-4267355228-style' ) ) add_css$3();

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
	style.id = 'svelte-1807189378-style';
	style.textContent = "\n\n[svelte-1807189378].left, [svelte-1807189378] .left,\n[svelte-1807189378].right, [svelte-1807189378] .right {\n  position: absolute;\n  top: 0;\n  height: 100%;\n  width: 50%;\n  overflow: hidden;\n}\n\n[svelte-1807189378].right, [svelte-1807189378] .right {\n  right: 0\n}\n\n[svelte-1807189378].half-circle, [svelte-1807189378] .half-circle {\n  height: 100%;\n  width: 200%;\n  position: absolute;\n  top: 0;\n  box-sizing: border-box;\n  border-width: 3px;\n  border-style: solid;\n  border-color: #000 #000 transparent #000;\n  border-radius: 50%;\n}\n\n[svelte-1807189378].left .half-circle, [svelte-1807189378] .left .half-circle {\n  border-right-color: transparent;\n}\n\n[svelte-1807189378].right .half-circle, [svelte-1807189378] .right .half-circle {\n  right: 0;\n  border-left-color: transparent;\n}\n\n";
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
			setAttribute( div, 'svelte-1807189378', '' );
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

		destroy: noop$1
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
	if ( !document.getElementById( 'svelte-1807189378-style' ) ) add_css$2();

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
    borderWidth: size => Math.round(size * 0.1154)
  }
}
}());

function add_css$1 () {
	var style = createElement( 'style' );
	style.id = 'svelte-647709901-style';
	style.textContent = "\n\n[svelte-647709901].arrow, [svelte-647709901] .arrow {\n  position: relative;\n  height: 100%;\n}\n\n[svelte-647709901].arrow-head-rotate, [svelte-647709901] .arrow-head-rotate {\n  height: 100%;\n  width: 100%;\n}\n\n";
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
			setAttribute( div, 'svelte-647709901', '' );
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
	if ( !document.getElementById( 'svelte-647709901-style' ) ) add_css$1();

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

		destroy: noop$1
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
    borderWidth: size => Math.round(size * 0.1154),
    animationOffset: initialProgress => {
      if (!initialProgress) { return 0 }
      return -(ANIMATION_DURATION * 1.1)
    }
  }
}
}());

function add_css$4 () {
	var style = createElement( 'style' );
	style.id = 'svelte-2754252755-style';
	style.textContent = "\n\n@keyframes svelte-2754252755-outer-rotate {\n  100% { transform: rotate(360deg); }\n}\n\n@keyframes svelte-2754252755-inner-rotate {\n  12.5% { transform: rotate(135deg); }\n  25%   { transform: rotate(270deg); }\n  37.5% { transform: rotate(405deg); }\n  50%   { transform: rotate(540deg); }\n  62.5% { transform: rotate(675deg); }\n  75%   { transform: rotate(810deg); }\n  87.5% { transform: rotate(945deg); }\n  100%  { transform: rotate(1080deg); }\n}\n\n[svelte-2754252755].spinner.animated, [svelte-2754252755] .spinner.animated {\n  animation: svelte-2754252755-outer-rotate 2.91667s linear infinite;\n}\n\n[svelte-2754252755].inner.animated, [svelte-2754252755] .inner.animated {\n  animation: svelte-2754252755-inner-rotate 5.25s cubic-bezier(0.35, 0, 0.25, 1) infinite;\n}\n\n[svelte-2754252755].spinner, [svelte-2754252755] .spinner {\n  width: 100%;\n  height: 100%;\n  position: relative;\n}\n\n[svelte-2754252755].inner, [svelte-2754252755] .inner {\n  height: 100%;\n}\n\n";
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
			setAttribute( div, 'svelte-2754252755', '' );
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
	if ( !document.getElementById( 'svelte-2754252755-style' ) ) add_css$4();

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

	if ( isInitial || ( 'emphasized' in newState && differs( state.emphasized, oldState.emphasized ) ) || ( 'size' in newState && differs( state.size, oldState.size ) ) ) {
		state.padding = newState.padding = template.computed.padding( state.emphasized, state.size );
	}

	if ( isInitial || ( 'size' in newState && differs( state.size, oldState.size ) ) || ( 'padding' in newState && differs( state.padding, oldState.padding ) ) || ( 'emphasized' in newState && differs( state.emphasized, oldState.emphasized ) ) ) {
		state.spinnerSize = newState.spinnerSize = template.computed.spinnerSize( state.size, state.padding, state.emphasized );
	}

	if ( isInitial || ( 'spinning' in newState && differs( state.spinning, oldState.spinning ) ) || ( 'lastProgressRatio' in newState && differs( state.lastProgressRatio, oldState.lastProgressRatio ) ) ) {
		state.arrowSyncRotate = newState.arrowSyncRotate = template.computed.arrowSyncRotate( state.spinning, state.lastProgressRatio );
	}
}

var template = (function () {
return {
  data () {
    return {
      size: 38,
      emphasized: false,
      progressRatio: undefined,
      lastProgressRatio: 0
    }
  },

  computed: {
    spinning: progressRatio => progressRatio === undefined,
    padding: (emphasized, size) => Math.round( (size * 0.2046) / (emphasized ? 1 : 1.7) ),
    spinnerSize: (size, padding, emphasized) => size - (padding * 2),
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
	style.id = 'svelte-3104553244-style';
	style.textContent = "\n\n[svelte-3104553244].refresh-indicator, [svelte-3104553244] .refresh-indicator {\n  width: 44px;\n  height: 44px;\n  padding: 4px;\n  box-sizing: border-box;\n  overflow: hidden;\n}\n\n[svelte-3104553244].emphasized, [svelte-3104553244] .emphasized {\n  padding: 9px;\n  border-radius: 50%;\n  background-color: #fff;\n  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.3);\n}\n\n[svelte-3104553244].arrow-sync-container, [svelte-3104553244] .arrow-sync-container {\n  height: 100%;\n}\n\n";
	appendNode( style, document.head );
}

function create_main_fragment ( state, component ) {
	var div, div_class_value, div_style_value;

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
			setAttribute( div, 'svelte-3104553244', '' );
			div.className = div_class_value = "refresh-indicator " + ( state.emphasized ? 'emphasized' : '' );
			div.style.cssText = div_style_value = "height: " + ( state.size ) + "px; width: " + ( state.size ) + "px; padding: " + ( state.padding ) + "px;";
		},

		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			if_block.mount( div, null );
		},

		update: function ( changed, state ) {
			if ( div_class_value !== ( div_class_value = "refresh-indicator " + ( state.emphasized ? 'emphasized' : '' ) ) ) {
				div.className = div_class_value;
			}

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
			size: state.spinnerSize,
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

			if ( 'spinnerSize' in changed ) spinner_changes.size = state.spinnerSize;
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
			size: state.spinnerSize,
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

			if ( 'spinnerSize' in changed ) arrow_changes.size = state.spinnerSize;
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

function Indicator$2 ( options ) {
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
	if ( !document.getElementById( 'svelte-3104553244-style' ) ) add_css();

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

assign( Indicator$2.prototype, proto );

Indicator$2.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = assign( {}, oldState, newState );
	recompute( this._state, newState, oldState, false );
	dispatchObservers( this, this._observers.pre, newState, oldState );
	this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

Indicator$2.prototype.teardown = Indicator$2.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	if ( detach !== false ) this._fragment.unmount();
	this._fragment.destroy();
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

const transition = (fn, ms, node) => new Promise(resolve => {
  node.style.transition = `all ${ms}ms`;
  const off = addEventListener(node, 'transitionend', () => {
    node.style.transition = '';
    off();
    resolve();
  });
  fn(node);
});

const clamp = (lower, higher, n) => Math.min(higher, Math.max(lower, n));

const refreshIndicatorHeight = 38;
const totalHeight = 46;

/* this sits at the top of the target element and hides the overflowing indicator
  it lets the indicator sit above it and be hidden and then come down into view
  sort of like being above the page, but for elements
*/
const VisibleArea = () => {
  const node = document.createElement('div');
  node.style.pointerEvents = 'none';
  node.style.overflow = 'hidden';
  node.style.position = 'absolute';
  node.style.top = 0;
  node.style.left = 0;
  node.style.right = 0;
  node.style.bottom = 0;

  const setActive = beActive => node.style.height = beActive ? 'auto' : 0;
  setActive(false);

  return { node, setActive }
};

const Container = ({ indicator }) => {
  const node = document.createElement('div');

 // webkit bugs without this. The element will often just not render.
  node.style.height = `${refreshIndicatorHeight}px`;
  node.style.width = '100%';
  node.style.pointerEvents = 'none';
  node.style.display = 'flex';
  node.style.justifyContent = 'center';
  node.style.position = 'absolute';
  node.style.paddingBottom = '8px';

  const setY = y => node.style.transform = `translateY(${y}px)`;

  return { node, setY }
};

const Indicator = ({ target }) => {
  target.style.position = 'relative'; // NOTE: ugly side-effect :/

  const indicatorNode = document.createElement('div');
  indicatorNode.style.transform = 'scale(1)';
  indicatorNode.style.opacity = 1;

  const indicator = new Indicator$2({
    target: indicatorNode,
    data: {
      size: refreshIndicatorHeight,
      emphasized: true
    }
  });

  const visibleArea = VisibleArea();
  const container = Container({ indicator });

  let y = 0;
  const setY = newY => {
    y = newY;
    container.setY(newY - totalHeight);
  };
  setY(0);

  const onPullStart = () => visibleArea.setActive(true);

  const maxY = 300;
  const onPullMove = ({
    tilRefreshRatio,
    tilRefreshDistance,
    overscrollDistance,
    overscrollDelta
  }) => {
    const resistance = clamp(0.1, 0.75, (maxY - overscrollDistance) / maxY);
    setY(y + overscrollDelta * resistance);

    // max rotation
    const ratio = Math.min(1.8, tilRefreshRatio);
    indicator.set({ progressRatio: ratio });
  };

  const onPullCancel = () => {
    return transition(node => node.style.transform = 'scale(0)', 250, indicatorNode)
      .then(() => {
        setY(0);
        indicatorNode.style.transform = 'scale(1)';
        visibleArea.setActive(false);
      })
  };

  const onRefreshStart = () => {
    indicator.set({ progressRatio: undefined });
    transition(() => setY(totalHeight + 15), 200, container.node);
  };

  const onRefreshEnd = onPullCancel;

  visibleArea.node.appendChild(container.node);
  container.node.appendChild(indicatorNode);
  target.append(visibleArea.node);

  return {
    node: visibleArea.node,
    height: totalHeight,
    distanceToRefresh: totalHeight + 50,
    maxOverscroll: 300,
    progressOffset: 35,
    elasticOverscroll: false,
    onPullStart,
    onPullMove,
    onPullCancel,
    onRefreshStart,
    onRefreshEnd
  }
};

const Spacer = ({ ptrElement }) => {
  const node = document.createElement('div');
  node.style.visibility = 'hidden';
  node.style.pointerEvents = 'none';

  let currentHeight = 0;

  const beFirstChild = () => ptrElement.insertBefore(node, ptrElement.firstElementChild);

  const justSetHeight = height => node.style.height = `${height}px`;
  const setHeight = height => {
    beFirstChild();
    justSetHeight(height);
    if (height > currentHeight) {
      ptrElement.scrollTop = ptrElement.scrollTop - (height - currentHeight);
    }
    currentHeight = height;
  };

  justSetHeight(currentHeight);

  return { setHeight, node }
};

const refreshIndicatorHeight$1 = 38;
const totalHeight$1 = 48;

const Container$1 = ({ indicator }) => {
  const node = document.createElement('div');
  node.style.height = '100%'; // webkit bugs without this. The element will often just not render.
  node.style.pointerEvents = 'none';
  node.style.display = 'flex';
  node.style.justifyContent = 'center';
  node.style.position = 'fixed';
  node.style.top = 0;
  node.style.left = 0;
  node.style.right = 0;

  const setY = y => node.style.transform = `translateY(${y}px)`;

  return { node, setY }
};

const Indicator$3 = ({ target }) => {
  const spacer = Spacer({ ptrElement: target });

  const indicatorNode = document.createElement('div');
  indicatorNode.style.paddingTop = `10px`;

  const indicator = new Indicator$2({
    target: indicatorNode,
    data: {
      size: refreshIndicatorHeight$1,
      emphasized: false
    }
  });

  const container = Container$1({ indicator });

  const setY = y => container.setY(Math.min(0, y));
  setY(-totalHeight$1);

  const onPullMove = ({ tilRefreshRatio, tilRefreshDistance }) => {
    setY(-tilRefreshDistance);

    // max rotation
    const ratio = Math.min(1.4, tilRefreshRatio);

    // adjust animation to start a little later so that it is in view when it starts
    const progressRatio = ratio < 0.4 ? 0 : ratio - (1 - ratio);

    indicator.set({ progressRatio });
  };

  const onPullCancel = () => {
    setY(-totalHeight$1);
  };

  const onRefreshStart = () => {
    indicator.set({ progressRatio: undefined });
    setY(0);
    spacer.setHeight(totalHeight$1);
  };

  const onRefreshEnd = () => {
    setY(-totalHeight$1);
    indicator.set({ progressRatio: 0 });
    return transition(() => spacer.setHeight(0), 150, spacer.node)
  };

  container.node.appendChild(indicatorNode);
  target.appendChild(container.node);

  return {
    node: container.node,
    height: totalHeight$1,
    distanceToRefresh: totalHeight$1,
    elasticOverscroll: true,
    onPullMove,
    onPullCancel,
    onRefreshStart,
    onRefreshEnd
  }
};

// https://docs.google.com/document/d/12Ay4s3NWake8Qd6xQeGiYimGJ_gCe0UMDZKwP9Ni4m8/edit#

const disableChromePtr = ({ disablePullGlow = true } = {}) => {
  let shouldDisablePtr, lastTouchY;

  const touchstart = e => {
    lastTouchY = 0;
    shouldDisablePtr = window.pageYOffset === 0;
  };

  const touchmove = e => {
    const touchY = e.touches[0].clientY;
    const touchYDelta = touchY - lastTouchY;
    lastTouchY = touchY;

    if (shouldDisablePtr) {
      shouldDisablePtr = false;

      if (touchYDelta > 0) {
        return e.preventDefault()
      }
    }

    if (disablePullGlow && window.pageYOffset === 0 && touchYDelta > 0) {
      return e.preventDefault()
    }
  };

  document.addEventListener('touchstart', touchstart, { passive: true }),
  document.addEventListener('touchmove', touchmove, { passive: false });

  return () => {
    document.removeEventListener('touchstart', touchstart);
    document.removeEventListener('touchmove', touchmove);
  }
};

var bowser = createCommonjsModule(function (module) {
/*!
 * Bowser - a browser detector
 * https://github.com/ded/bowser
 * MIT License | (c) Dustin Diaz 2015
 */

!function (root, name, definition) {
  if ('object' != 'undefined' && module.exports) module.exports = definition();
  else if (typeof undefined == 'function' && undefined.amd) undefined(name, definition);
  else root[name] = definition();
}(commonjsGlobal, 'bowser', function () {
  /**
    * See useragents.js for examples of navigator.userAgent
    */

  var t = true;

  function detect(ua) {

    function getFirstMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[1]) || '';
    }

    function getSecondMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[2]) || '';
    }

    var iosdevice = getFirstMatch(/(ipod|iphone|ipad)/i).toLowerCase()
      , likeAndroid = /like android/i.test(ua)
      , android = !likeAndroid && /android/i.test(ua)
      , nexusMobile = /nexus\s*[0-6]\s*/i.test(ua)
      , nexusTablet = !nexusMobile && /nexus\s*[0-9]+/i.test(ua)
      , chromeos = /CrOS/.test(ua)
      , silk = /silk/i.test(ua)
      , sailfish = /sailfish/i.test(ua)
      , tizen = /tizen/i.test(ua)
      , webos = /(web|hpw)os/i.test(ua)
      , windowsphone = /windows phone/i.test(ua)
      , samsungBrowser = /SamsungBrowser/i.test(ua)
      , windows = !windowsphone && /windows/i.test(ua)
      , mac = !iosdevice && !silk && /macintosh/i.test(ua)
      , linux = !android && !sailfish && !tizen && !webos && /linux/i.test(ua)
      , edgeVersion = getFirstMatch(/edge\/(\d+(\.\d+)?)/i)
      , versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i)
      , tablet = /tablet/i.test(ua) && !/tablet pc/i.test(ua)
      , mobile = !tablet && /[^-]mobi/i.test(ua)
      , xbox = /xbox/i.test(ua)
      , result;

    if (/opera/i.test(ua)) {
      //  an old Opera
      result = {
        name: 'Opera'
      , opera: t
      , version: versionIdentifier || getFirstMatch(/(?:opera|opr|opios)[\s\/](\d+(\.\d+)?)/i)
      };
    } else if (/opr|opios/i.test(ua)) {
      // a new Opera
      result = {
        name: 'Opera'
        , opera: t
        , version: getFirstMatch(/(?:opr|opios)[\s\/](\d+(\.\d+)?)/i) || versionIdentifier
      };
    }
    else if (/SamsungBrowser/i.test(ua)) {
      result = {
        name: 'Samsung Internet for Android'
        , samsungBrowser: t
        , version: versionIdentifier || getFirstMatch(/(?:SamsungBrowser)[\s\/](\d+(\.\d+)?)/i)
      };
    }
    else if (/coast/i.test(ua)) {
      result = {
        name: 'Opera Coast'
        , coast: t
        , version: versionIdentifier || getFirstMatch(/(?:coast)[\s\/](\d+(\.\d+)?)/i)
      };
    }
    else if (/yabrowser/i.test(ua)) {
      result = {
        name: 'Yandex Browser'
      , yandexbrowser: t
      , version: versionIdentifier || getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)
      };
    }
    else if (/ucbrowser/i.test(ua)) {
      result = {
          name: 'UC Browser'
        , ucbrowser: t
        , version: getFirstMatch(/(?:ucbrowser)[\s\/](\d+(?:\.\d+)+)/i)
      };
    }
    else if (/mxios/i.test(ua)) {
      result = {
        name: 'Maxthon'
        , maxthon: t
        , version: getFirstMatch(/(?:mxios)[\s\/](\d+(?:\.\d+)+)/i)
      };
    }
    else if (/epiphany/i.test(ua)) {
      result = {
        name: 'Epiphany'
        , epiphany: t
        , version: getFirstMatch(/(?:epiphany)[\s\/](\d+(?:\.\d+)+)/i)
      };
    }
    else if (/puffin/i.test(ua)) {
      result = {
        name: 'Puffin'
        , puffin: t
        , version: getFirstMatch(/(?:puffin)[\s\/](\d+(?:\.\d+)?)/i)
      };
    }
    else if (/sleipnir/i.test(ua)) {
      result = {
        name: 'Sleipnir'
        , sleipnir: t
        , version: getFirstMatch(/(?:sleipnir)[\s\/](\d+(?:\.\d+)+)/i)
      };
    }
    else if (/k-meleon/i.test(ua)) {
      result = {
        name: 'K-Meleon'
        , kMeleon: t
        , version: getFirstMatch(/(?:k-meleon)[\s\/](\d+(?:\.\d+)+)/i)
      };
    }
    else if (windowsphone) {
      result = {
        name: 'Windows Phone'
      , windowsphone: t
      };
      if (edgeVersion) {
        result.msedge = t;
        result.version = edgeVersion;
      }
      else {
        result.msie = t;
        result.version = getFirstMatch(/iemobile\/(\d+(\.\d+)?)/i);
      }
    }
    else if (/msie|trident/i.test(ua)) {
      result = {
        name: 'Internet Explorer'
      , msie: t
      , version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
      };
    } else if (chromeos) {
      result = {
        name: 'Chrome'
      , chromeos: t
      , chromeBook: t
      , chrome: t
      , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      };
    } else if (/chrome.+? edge/i.test(ua)) {
      result = {
        name: 'Microsoft Edge'
      , msedge: t
      , version: edgeVersion
      };
    }
    else if (/vivaldi/i.test(ua)) {
      result = {
        name: 'Vivaldi'
        , vivaldi: t
        , version: getFirstMatch(/vivaldi\/(\d+(\.\d+)?)/i) || versionIdentifier
      };
    }
    else if (sailfish) {
      result = {
        name: 'Sailfish'
      , sailfish: t
      , version: getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i)
      };
    }
    else if (/seamonkey\//i.test(ua)) {
      result = {
        name: 'SeaMonkey'
      , seamonkey: t
      , version: getFirstMatch(/seamonkey\/(\d+(\.\d+)?)/i)
      };
    }
    else if (/firefox|iceweasel|fxios/i.test(ua)) {
      result = {
        name: 'Firefox'
      , firefox: t
      , version: getFirstMatch(/(?:firefox|iceweasel|fxios)[ \/](\d+(\.\d+)?)/i)
      };
      if (/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(ua)) {
        result.firefoxos = t;
      }
    }
    else if (silk) {
      result =  {
        name: 'Amazon Silk'
      , silk: t
      , version : getFirstMatch(/silk\/(\d+(\.\d+)?)/i)
      };
    }
    else if (/phantom/i.test(ua)) {
      result = {
        name: 'PhantomJS'
      , phantom: t
      , version: getFirstMatch(/phantomjs\/(\d+(\.\d+)?)/i)
      };
    }
    else if (/slimerjs/i.test(ua)) {
      result = {
        name: 'SlimerJS'
        , slimer: t
        , version: getFirstMatch(/slimerjs\/(\d+(\.\d+)?)/i)
      };
    }
    else if (/blackberry|\bbb\d+/i.test(ua) || /rim\stablet/i.test(ua)) {
      result = {
        name: 'BlackBerry'
      , blackberry: t
      , version: versionIdentifier || getFirstMatch(/blackberry[\d]+\/(\d+(\.\d+)?)/i)
      };
    }
    else if (webos) {
      result = {
        name: 'WebOS'
      , webos: t
      , version: versionIdentifier || getFirstMatch(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)
      };
      /touchpad\//i.test(ua) && (result.touchpad = t);
    }
    else if (/bada/i.test(ua)) {
      result = {
        name: 'Bada'
      , bada: t
      , version: getFirstMatch(/dolfin\/(\d+(\.\d+)?)/i)
      };
    }
    else if (tizen) {
      result = {
        name: 'Tizen'
      , tizen: t
      , version: getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i) || versionIdentifier
      };
    }
    else if (/qupzilla/i.test(ua)) {
      result = {
        name: 'QupZilla'
        , qupzilla: t
        , version: getFirstMatch(/(?:qupzilla)[\s\/](\d+(?:\.\d+)+)/i) || versionIdentifier
      };
    }
    else if (/chromium/i.test(ua)) {
      result = {
        name: 'Chromium'
        , chromium: t
        , version: getFirstMatch(/(?:chromium)[\s\/](\d+(?:\.\d+)?)/i) || versionIdentifier
      };
    }
    else if (/chrome|crios|crmo/i.test(ua)) {
      result = {
        name: 'Chrome'
        , chrome: t
        , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      };
    }
    else if (android) {
      result = {
        name: 'Android'
        , version: versionIdentifier
      };
    }
    else if (/safari|applewebkit/i.test(ua)) {
      result = {
        name: 'Safari'
      , safari: t
      };
      if (versionIdentifier) {
        result.version = versionIdentifier;
      }
    }
    else if (iosdevice) {
      result = {
        name : iosdevice == 'iphone' ? 'iPhone' : iosdevice == 'ipad' ? 'iPad' : 'iPod'
      };
      // WTF: version is not part of user agent in web apps
      if (versionIdentifier) {
        result.version = versionIdentifier;
      }
    }
    else if(/googlebot/i.test(ua)) {
      result = {
        name: 'Googlebot'
      , googlebot: t
      , version: getFirstMatch(/googlebot\/(\d+(\.\d+))/i) || versionIdentifier
      };
    }
    else {
      result = {
        name: getFirstMatch(/^(.*)\/(.*) /),
        version: getSecondMatch(/^(.*)\/(.*) /)
     };
   }

    // set webkit or gecko flag for browsers based on these engines
    if (!result.msedge && /(apple)?webkit/i.test(ua)) {
      if (/(apple)?webkit\/537\.36/i.test(ua)) {
        result.name = result.name || "Blink";
        result.blink = t;
      } else {
        result.name = result.name || "Webkit";
        result.webkit = t;
      }
      if (!result.version && versionIdentifier) {
        result.version = versionIdentifier;
      }
    } else if (!result.opera && /gecko\//i.test(ua)) {
      result.name = result.name || "Gecko";
      result.gecko = t;
      result.version = result.version || getFirstMatch(/gecko\/(\d+(\.\d+)?)/i);
    }

    // set OS flags for platforms that have multiple browsers
    if (!result.windowsphone && !result.msedge && (android || result.silk)) {
      result.android = t;
    } else if (!result.windowsphone && !result.msedge && iosdevice) {
      result[iosdevice] = t;
      result.ios = t;
    } else if (mac) {
      result.mac = t;
    } else if (xbox) {
      result.xbox = t;
    } else if (windows) {
      result.windows = t;
    } else if (linux) {
      result.linux = t;
    }

    function getWindowsVersion (s) {
      switch (s) {
        case 'NT': return 'NT'
        case 'XP': return 'XP'
        case 'NT 5.0': return '2000'
        case 'NT 5.1': return 'XP'
        case 'NT 5.2': return '2003'
        case 'NT 6.0': return 'Vista'
        case 'NT 6.1': return '7'
        case 'NT 6.2': return '8'
        case 'NT 6.3': return '8.1'
        case 'NT 10.0': return '10'
        default: return undefined
      }
    }
    
    // OS version extraction
    var osVersion = '';
    if (result.windows) {
      osVersion = getWindowsVersion(getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i));
    } else if (result.windowsphone) {
      osVersion = getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i);
    } else if (result.mac) {
      osVersion = getFirstMatch(/Mac OS X (\d+([_\.\s]\d+)*)/i);
      osVersion = osVersion.replace(/[_\s]/g, '.');
    } else if (iosdevice) {
      osVersion = getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i);
      osVersion = osVersion.replace(/[_\s]/g, '.');
    } else if (android) {
      osVersion = getFirstMatch(/android[ \/-](\d+(\.\d+)*)/i);
    } else if (result.webos) {
      osVersion = getFirstMatch(/(?:web|hpw)os\/(\d+(\.\d+)*)/i);
    } else if (result.blackberry) {
      osVersion = getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i);
    } else if (result.bada) {
      osVersion = getFirstMatch(/bada\/(\d+(\.\d+)*)/i);
    } else if (result.tizen) {
      osVersion = getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i);
    }
    if (osVersion) {
      result.osversion = osVersion;
    }

    // device type extraction
    var osMajorVersion = !result.windows && osVersion.split('.')[0];
    if (
         tablet
      || nexusTablet
      || iosdevice == 'ipad'
      || (android && (osMajorVersion == 3 || (osMajorVersion >= 4 && !mobile)))
      || result.silk
    ) {
      result.tablet = t;
    } else if (
         mobile
      || iosdevice == 'iphone'
      || iosdevice == 'ipod'
      || android
      || nexusMobile
      || result.blackberry
      || result.webos
      || result.bada
    ) {
      result.mobile = t;
    }

    // Graded Browser Support
    // http://developer.yahoo.com/yui/articles/gbs
    if (result.msedge ||
        (result.msie && result.version >= 10) ||
        (result.yandexbrowser && result.version >= 15) ||
		    (result.vivaldi && result.version >= 1.0) ||
        (result.chrome && result.version >= 20) ||
        (result.samsungBrowser && result.version >= 4) ||
        (result.firefox && result.version >= 20.0) ||
        (result.safari && result.version >= 6) ||
        (result.opera && result.version >= 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] >= 6) ||
        (result.blackberry && result.version >= 10.1)
        || (result.chromium && result.version >= 20)
        ) {
      result.a = t;
    }
    else if ((result.msie && result.version < 10) ||
        (result.chrome && result.version < 20) ||
        (result.firefox && result.version < 20.0) ||
        (result.safari && result.version < 6) ||
        (result.opera && result.version < 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] < 6)
        || (result.chromium && result.version < 20)
        ) {
      result.c = t;
    } else result.x = t;

    return result
  }

  var bowser = detect(typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');

  bowser.test = function (browserList) {
    for (var i = 0; i < browserList.length; ++i) {
      var browserItem = browserList[i];
      if (typeof browserItem=== 'string') {
        if (browserItem in bowser) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Get version precisions count
   *
   * @example
   *   getVersionPrecision("1.10.3") // 3
   *
   * @param  {string} version
   * @return {number}
   */
  function getVersionPrecision(version) {
    return version.split(".").length;
  }

  /**
   * Array::map polyfill
   *
   * @param  {Array} arr
   * @param  {Function} iterator
   * @return {Array}
   */
  function map(arr, iterator) {
    var result = [], i;
    if (Array.prototype.map) {
      return Array.prototype.map.call(arr, iterator);
    }
    for (i = 0; i < arr.length; i++) {
      result.push(iterator(arr[i]));
    }
    return result;
  }

  /**
   * Calculate browser version weight
   *
   * @example
   *   compareVersions(['1.10.2.1',  '1.8.2.1.90'])    // 1
   *   compareVersions(['1.010.2.1', '1.09.2.1.90']);  // 1
   *   compareVersions(['1.10.2.1',  '1.10.2.1']);     // 0
   *   compareVersions(['1.10.2.1',  '1.0800.2']);     // -1
   *
   * @param  {Array<String>} versions versions to compare
   * @return {Number} comparison result
   */
  function compareVersions(versions) {
    // 1) get common precision for both versions, for example for "10.0" and "9" it should be 2
    var precision = Math.max(getVersionPrecision(versions[0]), getVersionPrecision(versions[1]));
    var chunks = map(versions, function (version) {
      var delta = precision - getVersionPrecision(version);

      // 2) "9" -> "9.0" (for precision = 2)
      version = version + new Array(delta + 1).join(".0");

      // 3) "9.0" -> ["000000000"", "000000009"]
      return map(version.split("."), function (chunk) {
        return new Array(20 - chunk.length).join("0") + chunk;
      }).reverse();
    });

    // iterate in reverse order by reversed chunks array
    while (--precision >= 0) {
      // 4) compare: "000000009" > "000000010" = false (but "9" > "10" = true)
      if (chunks[0][precision] > chunks[1][precision]) {
        return 1;
      }
      else if (chunks[0][precision] === chunks[1][precision]) {
        if (precision === 0) {
          // all version chunks are same
          return 0;
        }
      }
      else {
        return -1;
      }
    }
  }

  /**
   * Check if browser is unsupported
   *
   * @example
   *   bowser.isUnsupportedBrowser({
   *     msie: "10",
   *     firefox: "23",
   *     chrome: "29",
   *     safari: "5.1",
   *     opera: "16",
   *     phantom: "534"
   *   });
   *
   * @param  {Object}  minVersions map of minimal version to browser
   * @param  {Boolean} [strictMode = false] flag to return false if browser wasn't found in map
   * @param  {String}  [ua] user agent string
   * @return {Boolean}
   */
  function isUnsupportedBrowser(minVersions, strictMode, ua) {
    var _bowser = bowser;

    // make strictMode param optional with ua param usage
    if (typeof strictMode === 'string') {
      ua = strictMode;
      strictMode = void(0);
    }

    if (strictMode === void(0)) {
      strictMode = false;
    }
    if (ua) {
      _bowser = detect(ua);
    }

    var version = "" + _bowser.version;
    for (var browser in minVersions) {
      if (minVersions.hasOwnProperty(browser)) {
        if (_bowser[browser]) {
          if (typeof minVersions[browser] !== 'string') {
            throw new Error('Browser version in the minVersion map should be a string: ' + browser + ': ' + String(minVersions));
          }

          // browser version and min supported version.
          return compareVersions([version, minVersions[browser]]) < 0;
        }
      }
    }

    return strictMode; // not found
  }

  /**
   * Check if browser is supported
   *
   * @param  {Object} minVersions map of minimal version to browser
   * @param  {Boolean} [strictMode = false] flag to return false if browser wasn't found in map
   * @param  {String}  [ua] user agent string
   * @return {Boolean}
   */
  function check(minVersions, strictMode, ua) {
    return !isUnsupportedBrowser(minVersions, strictMode, ua);
  }

  bowser.isUnsupportedBrowser = isUnsupportedBrowser;
  bowser.compareVersions = compareVersions;
  bowser.check = check;

  /*
   * Set our detect method to the main bowser object so we can
   * reuse it to test other user agents.
   * This is needed to implement future tests.
   */
  bowser._detect = detect;

  return bowser
});
});

var index$4 = createCommonjsModule(function (module) {
'use strict';
module.exports = (promise, onFinally) => {
	onFinally = onFinally || (() => {});

	return promise.then(
		val => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => val),
		err => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => {
			throw err;
		})
	);
};
});

var index$3 = createCommonjsModule(function (module) {
'use strict';


class TimeoutError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TimeoutError';
	}
}

module.exports = (promise, ms, fallback) => new Promise((resolve, reject) => {
	if (typeof ms !== 'number' && ms >= 0) {
		throw new TypeError('Expected `ms` to be a positive number');
	}

	const timer = setTimeout(() => {
		if (typeof fallback === 'function') {
			resolve(fallback());
			return;
		}

		const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${ms} milliseconds`;
		const err = fallback instanceof Error ? fallback : new TimeoutError(message);

		reject(err);
	}, ms);

	index$4(
		promise.then(resolve, reject),
		() => {
			clearTimeout(timer);
		}
	);
});

module.exports.TimeoutError = TimeoutError;
});

// TODO: a UI for changing the ptr parameters would be nice

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const contentElem = document.createElement('div');
contentElem.className = 'content';
document.body.appendChild(contentElem);
const contentUrl = 'https://baconipsum.com/api/?type=all-meat&paras=15&start-with-lorem=1&format=html';

const fetchHtml = fetch(contentUrl)
  .then(resp => resp.text());

const refreshContent = () => index$3(fetchHtml, 2000)
  .catch(err => {
    return `<p>The request to get nice filler content failed, so here's a random number: <b>${Math.random()}</b></p>

<p>And here's the thing that happened with the request: <b>${err}</b></p>`
  })
  .then(html => contentElem.innerHTML = html);

const enableChromePtr = (bowser.mobile && bowser.chrome) ? disableChromePtr() : index;

const ptr = pullToRefresh({
  element: document.body,
  indicator: (bowser.webkit ? Indicator$3 : Indicator)({ target: document.body }),
  onRefresh: () => wait(900) // some artificial delay
    .then(() => index$3(refreshContent(), 2000))
});

ptr.refresh();

}());
