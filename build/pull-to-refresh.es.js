function nop$1(){}

var index = nop$1;

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

export default pullToRefresh;
