/**
   Simple JavaScript wrapper for quickly making web and mobile games.
   Eliminates the complexity of JavaScript prototypes and the full the
   HTML/JavaScript APIs without hiding the language itself or requiring
   external tools.
   
   Private APIs are prefixed with "_ch_".  Unprefixed entry points are
   meant to be called from the game code. The private APIs are
   intentionally not protected by a private scope to allow advanced
   games to invoke or replace them (at their own risk).
   
   Design and implementation by Morgan McGuire.
   Additional development by Lily Riopelle.

   This is Open Source under the BSD license: http://www.opensource.org/licenses/bsd-license.php

   Copyright (c) 2012-2014, Morgan McGuire
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:

   Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
   Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the
   distribution.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS
   AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
   INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
   MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS
   BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
   OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
   OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
   USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
   DAMAGE.
*/

// Intentionally not strict--doing so prevents us from generating a
// call stack.
// "use strict";

/** True on iOS */
var _ch_isiOS = function () {
        var u = navigator.userAgent.toLowerCase();
        return (u.indexOf('iphone') !== -1 || 
                u.indexOf('ipad') !== -1 ||
                u.indexOf('ipod') !== -1);
    }();

var _ch_isSafari = 
    function() {
        var u = navigator.userAgent.toLowerCase();

        // When run full-screen, Safari iOS reports itself as iPhone
        var x =
        ((u.indexOf('iphone') !== -1) ||
         (u.indexOf('ipad') !== -1) ||
         (u.indexOf('ipod') !== -1) ||
         (u.indexOf('safari') !== -1)) && 
        (u.indexOf('chrome') === -1);

        // If we return the above expression directly it miscompiles...on Safari!
        return x;
    }();

var _ch_isFirefox = (navigator.userAgent.toLowerCase().indexOf("firefox") !== -1);

var _ch_isLocal  =  (window.location.toString().substr(0, 7) === "file://");

var _ch_isChrome =  (navigator.userAgent.toLowerCase().indexOf("chrome") !== -1);

var _ch_isMobile = (navigator.userAgent.toLowerCase().indexOf("mobi") !== -1);

/** For webkit browsers */
var _ch_isWebkit = (navigator.userAgent.toLowerCase().indexOf('webkit') !== -1);


if (Math.sign === undefined) {
    // Safari lacks Math.sign
    Math.sign = function(x) { 
        if (x > 0) { return 1; }
        else if (x < 0) { return -1; }
        else { return 0; }
    };
}

// Switch to web audio support, which has more features and lower latency
var _ch_audioContext;

if (! (_ch_isLocal && _ch_isChrome)) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (window.AudioContext) {
        _ch_audioContext = new AudioContext();
    }
}

/* Returns the version of Internet Explorer or -1
   (indicating the use of another browser). */
function _ch_getInternetExplorerVersion() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName === 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null) rv = parseFloat( RegExp.$1 );
    }
    return rv;
}

var _ch_isOldIE = (_ch_getInternetExplorerVersion() > -1) && 
                  (_ch_getInternetExplorerVersion() < 10);

/** For Mozilla based browsers. Chrome reports itself as webkit,
    mozilla, safari, and chrome. IE also reports itself as mozilla.*/
var _ch_isMozilla = ! _ch_isWebkit &&
    (navigator.userAgent.toLowerCase().indexOf('mozilla') !== -1) &&
    (_ch_getInternetExplorerVersion() === -1);

var _ch_hasTouchEvents = ('ontouchstart' in window) || // works on most browsers 
                  (window.navigator.msMaxTouchPoints > 0); // works on ie10

// Ensure that the typed array types are defined
if (typeof Float32Array === 'undefined') this.Float32Array = Array;
if (typeof Float64Array === 'undefined') this.Float64Array = Array;
if (typeof Int8Array === 'undefined') this.Int8Array = Array;
if (typeof Uint8Array === 'undefined') this.Uint8Array = Array;
if (typeof Int16Array === 'undefined') this.Int16Array = Array;
if (typeof Uint16Array === 'undefined') this.Uint16Array = Array;
if (typeof Int32Array === 'undefined') this.Int32Array = Array;
if (typeof Uint32Array === 'undefined') this.Uint32Array = Array;


if (console && ! console.assert) {
    console.assert = function(val, msg) {
        if (! val) {
            throw "Assertion failed: " + msg;
        }
    };
}

// Cross-browser support for gamepad API
navigator.getGamepads = navigator.getGamePads || navigator.getGamepads || navigator.webkitGetGamepads || function () { return []; };

// Cross-browser support for WebRTC
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

// Trigger the browser to notice a gamepad the first time that any
// button is pressed, even if the application itself hasn't polled
// yet.
navigator.getGamepads();

// Add support for fround on browsers that lack it
if (! Math.fround) {
    Math.fround = function(x) { return x; }
}

/**
   <variable name="GAMEPAD" type="Object" category="interaction" level="advanced">
     <description>
     <p>
       Named constants for the gamepad API for use in event handling.
     </p>
     <listing>
function onGamepadMove(x, y, stickId, gamepadId) {
   if (stickId == GAMEPAD.STICK.LEFT) { ... }
}

function onGamepadStart(buttonId, gamepadId) {
   if (buttonId == GAMEPAD.A) { ... }
   console.log(GAMEPAD.BUTTON_NAME[buttonId]);
}
     </listing>
     <p>
       Gamepads do not work until a player has pressed a button to initialize and
       implicitly grant the browser access to read them.
     </p>
    </description>
   </variable>
*/
// State from previous frame
var _ch_gamepadState = [];

function _ch_makeGamepadState(gamepad) {
    function makeZero(n) {
        var a = makeArray(n);
        for (var i = 0; i < n; ++i) { a[i] = 0; }
        return a;
    }

    return {
        id         : gamepad.id,

        // Some of these are synthesized from the sticks
        buttons    : makeZero(25),
        oldButtons : makeZero(25),

        // Add the dpad as two virtual axes
        axes       : makeZero(6),

        // Codeheart adds two axes because it maps the triggers here as well
        lastEventAxes : makeZero(8)
    };
}

var GAMEPAD = {
    BUTTON: {
        // "Face" buttons
        A: 0,
        B: 1,
        X: 2,
        Y: 3,

        LEFT_SHOULDER: 4, // Top shoulder buttons
        RIGHT_SHOULDER: 5,
        LEFT_TRIGGER: 6,
        RIGHT_TRIGGER: 7,
        SELECT: 8,
        START: 9,
        
        // Analog stick pressed down
        LEFT_STICK: 10,
        RIGHT_STICK: 11,

        DPAD_UP: 12,
        DPAD_DOWN: 13,
        DPAD_LEFT: 14,
        DPAD_RIGHT: 15,
        HOME: 16,

        // Treat the analog sticks as digital as well
        LEFT_UP: 17,
        LEFT_DOWN: 18,
        LEFT_LEFT: 19,
        LEFT_RIGHT: 20,

        RIGHT_UP: 21,
        RIGHT_DOWN: 22,
        RIGHT_LEFT: 23,
        RIGHT_RIGHT: 24,
    },

    BUTTON_NAME : [],

    STICK: {
        LEFT: 0,
        RIGHT: 1,
        DPAD : 2,
        LEFT_TRIGGER: 3,
        RIGHT_TRIGGER: 4,
    },

    STICK_NAME : [],
};

// Map the names
(function() {
    for (var k in GAMEPAD.BUTTON) {
        GAMEPAD.BUTTON_NAME[GAMEPAD.BUTTON[k]] = k;
    }

    for (var k in GAMEPAD.STICK) {
        GAMEPAD.STICK_NAME[GAMEPAD.STICK[k]] = k;
    }
})();

GAMEPAD = Object.freeze(GAMEPAD);


/* Process gamepads, creating events for buttons */
function _ch_processGamepads() {
    var b, g;
    var gamepadArray = navigator.getGamepads();
    if (gamepadArray && (gamepadArray.length > 0)) {
        // There are gamepads
        for (g = 0; g < gamepadArray.length; ++g) {
            var webGamepad = gamepadArray[g];

            // Chrome defines a fixed-length array, some of the
            // elements of which are undefined
            if (webGamepad) {
                if (_ch_gamepadState.length < g + 1) {
                    // Initialize the old gamepad object
                    resizeArray(_ch_gamepadState, g);
                    _ch_gamepadState[g] = _ch_makeGamepadState(webGamepad);
                }
                
                // Latch the state
                var state = _ch_gamepadState[g];
                for (b = 0; b < 17; ++b) {
                    state.oldButtons[b] = state.buttons[b];
                    state.buttons[b]    = webGamepad.buttons[b].value;
                } // b

                // Copy the virtual analog buttons (these will be updated below
                // with current values)
                for (b = 17; b < 25; ++b) {
                    state.oldButtons[b] = state.buttons[b];
                } // b

                // Treat the center as a dead zone
                var ANALOG_DEAD_ZONE = 0.17;

                for (b = 0; b < 4; ++b) {
                    state.axes[b] = webGamepad.axes[b];
                    if (Math.abs(state.axes[b]) < ANALOG_DEAD_ZONE) {
                        state.axes[b] = 0;
                    }
                } // b

                // Create the virtual analog dpad axes
                state.axes[4] = state.buttons[GAMEPAD.BUTTON.DPAD_RIGHT] - state.buttons[GAMEPAD.BUTTON.DPAD_LEFT];
                state.axes[5] = state.buttons[GAMEPAD.BUTTON.DPAD_DOWN]  - state.buttons[GAMEPAD.BUTTON.DPAD_UP];
            } // if gamepad
        } // g

        // Trigger events as needed by comparing state. We do this
        // after latching all state so that the current consistent
        // state can be querried if needed by advanced applications
        for (g = 0; g < _ch_gamepadState.length; ++g) {
            var gamepad = _ch_gamepadState[g];

            // A stick must move at least 5% to register as a change,
            // otherwise the slightest pressure, including pressing
            // OTHER buttons, can cause excessive move events
            var ANALOG_THRESHOLD = 0.05;

            var ANALOG_TO_BUTTON_THRESHOLD = 0.5;

            // Process axes in pairs first, synthesizing button values as well
            for (b = 0; b < 6; b += 2) {
                if ((Math.abs(gamepad.axes[b]     - gamepad.lastEventAxes[b]) > ANALOG_THRESHOLD) ||
                    (Math.abs(gamepad.axes[b + 1] - gamepad.lastEventAxes[b + 1]) > ANALOG_THRESHOLD)) {

                    gamepad.lastEventAxes[b]     = gamepad.axes[b];
                    gamepad.lastEventAxes[b + 1] = gamepad.axes[b + 1];

                    // Stick event
                    _ch_onGamepadMove(gamepad.axes[b], gamepad.axes[b + 1], b / 2, g);

                    if (b < 4) {
                        // Sythesize button values for analog sticks (not for the virtual analog dpad, though!)
                        var indexOffset = b * 2;
                        
                        // Up
                        gamepad.buttons[17 + indexOffset] = (gamepad.axes[b + 1] < -ANALOG_TO_BUTTON_THRESHOLD);
                        
                        // Down
                        gamepad.buttons[18 + indexOffset] = (gamepad.axes[b + 1] > +ANALOG_TO_BUTTON_THRESHOLD);
                        
                        // Left
                        gamepad.buttons[19 + indexOffset] = (gamepad.axes[b] < -ANALOG_TO_BUTTON_THRESHOLD);
                        
                        // Right
                        gamepad.buttons[20 + indexOffset] = (gamepad.axes[b] > +ANALOG_TO_BUTTON_THRESHOLD);
                    }
                }
            } // b

            // Process the triggers
            for (b = 0; b < 2; ++b) {
                if (Math.abs(gamepad.buttons[6 + b] - gamepad.lastEventAxes[6 + b]) > ANALOG_THRESHOLD) {
                    gamepad.lastEventAxes[6 + b] = gamepad.buttons[6 + b];
                    // Stick event
                    _ch_onGamepadMove(gamepad.lastEventAxes[6 + b], 0, 3 + b, g);
                }
            }

            // Buttons
            for (b = 0; b < gamepad.buttons.length; ++b) {
                if (gamepad.oldButtons[b] !== gamepad.buttons[b]) {
                    if (gamepad.buttons[b]) {
                        _ch_onGamepadStart(b, g);
                    } else {
                        _ch_onGamepadEnd(b, g);
                    }
                }
            } // b
        } // g
        
    }
}


/**
   <function name="onGamepadStart" category="interaction" level="advanced">
     <description>
       <p>
         Occurs when a gamepad button is first pressed down. The triggers
         D-pad, and analog sticks are also mapped as buttons for convenience.
       </p>
    </description>
    <param name="buttonId" type="Number">Index of the button.</param>
    <param name="gamepadId" type="Number">Index of the gamepad.</param>
    <see><api>GAMEPAD</api>, <api>onGamepadEnd</api>, <api>onGamepadMove</api></see>
  </function>
*/
function _ch_onGamepadStart(buttonId, gamepadId) {
    if ((_ch_mode === _ch_PLAY) && (typeof onGamepadStart === "function")) {
        _ch_safeApply(onGamepadStart, buttonId, gamepadId);
    }
}


/**
   <function name="onGamepadEnd" category="interaction" level="advanced">
     <description>
       <p>
         Occurs when a gamepad button is releaed. The triggers
         D-pad, and analog sticks are also mapped as buttons for convenience.
       </p>
    </description>
    <param name="buttonId" type="Number">Index of the button.</param>
    <param name="gamepadId" type="Number">Index of the gamepad.</param>
    <see><api>GAMEPAD</api>, <api>onGamepadStart</api>, <api>onGamepadMove</api></see>
  </function>
*/
function _ch_onGamepadEnd(buttonId, gamepadId) {
    if ((_ch_mode === _ch_PLAY) && (typeof onGamepadEnd === "function")) {
        _ch_safeApply(onGamepadEnd, buttonId, gamepadId);
    }
}


/**
   <function name="onGamepadMove" category="interaction" level="advanced">
     <description>
       <p>
        Occurs whenever a gamepad analog stick has moved.
        The D-pad and triggers are also mapped as virtual
        analog sticks for convenience.
       </p>
    </description>
    <param name="x" type="Number">Horizontal value on [-1, 1]. Negative is left. Triggers are always on [0, 1].</param>
    <param name="y" type="Number">Vertical value on [-1, 1]. Negative is up. Triggers are always 0.</param>
    <param name="stickId" type="Number">Index of the analog stick.</param>
    <param name="gamepadId" type="Number">Index of the gamepad.</param>
    <see><api>GAMEPAD</api>, <api>onGamepadStart</api>, <api>onGamepadEnd</api></see>
  </function>
*/
function _ch_onGamepadMove(x, y, stickId, gamepadId) {
    if ((_ch_mode === _ch_PLAY) && (typeof onGamepadMove === "function")) {
        _ch_safeApply(onGamepadMove, x, y, stickId, gamepadId);
    }
}



/**
   <variable name="canvas" type="Canvas" category="core" level="advanced">
     <description>
     <p>
       The display screen.
     </p>
     <p>
     Several width and height variables are available:
     <ul>
      <li><code><api>screenWidth</api></code> is the extent of the rendering and coordinate system (which is the value most frequently used) in virtual pixels. This is set by <api>defineGame</api> and is either 1920 or 1280, depending on the desired orientation.  Most game code should refer to this value exclusively.</li>
      <li> <code>canvas.width</code> is the true width of the canvas in (offscreen) pixels for rendering commands.  This controls the image quality.  It is automatically set when the browser window resizes or orientation changes. This variable is not usually needed by game code. If adaptive resolution is disabled (in <api>defineGame</api>), then this matches <code>screenWidth</code>, although doing so will reduce image quality on high-resolution displays and reduce performance on low-resolution displays.</li>
      <li><code>canvas.style.width</code> is the size of the canvas on the display screen in terms of physical pixels (although retina displays may misrepresent their pixel resolution). This is automatically adjusted based on browser window size or device resolution to fill the screen. This variable is not usually needed by game code.</li>
      </ul>
     </p>
     <p>
       You can extract a 2D rendering context with:

       <listing>
         var ctx = canvas.getContext("2d");
       </listing>
       and then directly make any of the HTML5
       <a href="http://www.w3schools.com/html5/html5_ref_canvas.asp">rendering</a>  calls directly
       on the context in addition to using the provided codeheart.js routines.
       </p>
     </description>
   </variable>
 */
/** The canvas object created by makeCanvas */
var canvas;


/**
   <variable name="ui" type="div" category="core" level="advanced">
     <description>
     <p>
       A HTML DIV object that has the same virtual resolution and size as
       <api>canvas</api> and floats above it.  You can use this to create
       resolution-independent user interface elements using HTML that
       interact with your game.
     </p>
     <p>
     Example:
     <listing>
    ui.innerHTML += "Hi There!&lt;br/&gt;&lt;input id='textbox' value='Type in here'&gt;&lt;/input&gt;";
    ui.innerHTML += "&lt;br/&gt;&lt;button id='b1' type='button'&gt;Push Me!&lt;/button&gt;";
    ui.innerHTML += "&lt;div style='position: absolute; background: #FFC; top: 500px; left: 200px; width: 200px; height: 200px;'&gt;&lt;/div&gt;";

    // Add an event handler
    var b1 = document.getElementById("b1");
    b1.onclick = function(event) { alert("Pushed"); };

    // Access a value
    var textbox = document.getElementById("textbox");
    console.log("The value in the textbox is '" + textbox.value + "'");
     </listing>
     </p>
     </description>
   </variable>
 */
/** The ui object created by makeCanvas */
var ui;

/** The current zoom factor */
var _ch_zoom;

/** The drawing context */
var _ch_ctx;

/** The setInterval object*/
var _ch_timer;

var _ch_titleScreenImage;
var _ch_gameName;
var _ch_authorName;
var _ch_orientation = "H";
var _ch_showTitleScreen = false;
var _ch_pauseWhenUnfocused = true;
var _ch_maxResolution = 1280;

/** Does the browser tab have focus? */
var _ch_hasFocus = true;

// System mode
var _ch_INIT  = "INIT";
var _ch_SETUP = "SETUP";
var _ch_TITLE = "TITLE";
var _ch_PLAY  = "PLAY";

var _ch_mode  = _ch_INIT;

/** Used by codeheart.js as the 'touch' identifier for the left mouse button,
    if one is present. */
var _ch_MOUSETOUCH_IDENTIFIER = -400;

var LEFT_MOUSE_BUTTON_ID = _ch_MOUSETOUCH_IDENTIFIER;
var RIGHT_MOUSE_BUTTON_ID = _ch_MOUSETOUCH_IDENTIFIER + 2;

/**
   <variable name="screenWidth" type="Number" category="core">
   <description>
    The virtual width of the screen, in pixels.  This is always 1920 in horizontal orientation and 1280 in vertical orientation.
    This is the largest x coordinate that will be returned from a touch event and is the largest x value that is visible
    from a drawing command.
   </description>
   <see><api>canvas</api>, <api>screenHeight</api></see>
   </variable>
 */
var screenWidth = null;

/**
   <variable name="screenHeight" type="Number" category="core">
   <description>
    The virtual height of the screen, in pixels.  This is 1280 in horizontal orientation and 1920 in vertical orientation.
    This is the largest y coordinate that will be returned from a touch event and is the largest y value that is visible
    from a drawing command.
   </description>
   <see><api>canvas</api>, <api>screenWidth</api></see>
   </variable>
 */
var screenHeight = null;


/**
   <external name="Key codes" category="core" href="http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes"/>
 */

/**
   <external name="Reserved words" category="core" href="http://www.quackit.com/javascript/javascript_reserved_words.cfm"/>
 */

/** Call this to create the canvas object by writing HTML directly to
    the document.  If you are not using the default play.html, then
    you can create the canvas object yourself.
 */
function _ch_makeCanvas() {
    /* Note: "position: fixed" causes the screen to occasionally end
       up scrolled halfway down the page on iOS 5.1, so I use "absolute"
       here.
       
       The black background is an attempt to speed up rendering by
       letting the browser know that it does not need to composite over
       elements underneath.
       
       */

    document.write
    ('<canvas ' +
     'id="canvas" ' +
     'oncontextmenu="return false" ' +
     'width="100" ' + 
     'height="100" ' +
     'style="' +
     ('display: block; ' +
      'position: fixed; ' +
      'top: 0px; ' +
      'left: 0px; ' +
      'background: #000; ' +

      // Disable text selection
      '-webkit-touch-callout: none; ' +
      '-webkit-user-select: none; ' + 
      '-khtml-user-select: none; ' +
      '-moz-user-select: none; ' +
      '-ms-user-select: none; ' +

      // Stop iOS from making the entire canvas gray when tapped
      '-webkit-tap-highlight-color: transparent; ' +

      // FireFox prints a warning if we specify user-select
      ((navigator.userAgent.indexOf('Firefox') === -1) ? 'user-select: none; ' : '') +

      // Trigger hardware acceleration on Chrome and firefox.  This slows down
      // desktop Safari by about 2x and doesn't seem necessary on iOS, so we don't use it there.
      ((! _ch_isSafari) ? '-webkit-transform: translateZ(0);' : '')
     ) + 
     '">' +
     '</canvas>');


    // Add enough height to force scrolling away of the iPhone toolbar
    if (_ch_isMobile) {
        // document.write('<div style="top: 1200px; position: absolute; z-index: -1000; height: 1px; width: 1px; visibility: hidden"></div>');
        // Hidden div that captures touch events that hit the background
        document.write('<div id="_ch_eventConsumer" style="top: 0px; left: 0px; position: fixed; z-index: -1000; width: 100%; height: 100%;"></div>');
    }

    // Ensure that the background is black in fullscreen 
    document.write('<style>html:-webkit-full-screen { width:100% !important; height:100%; background-color: black; }</style>');
    document.write('<style>html:-moz-full-screen { width:100% !important; height:100%; background-color: black; }</style>');
    document.write('<style>html:fullscreen { width:100% !important; height:100%; background-color: black; }</style>');

    // Make objects within the UI pane have a reasonable font size
    // relative to the virtual screen and color by default
    document.write('<style>' +
                   'div#ui { color: #FFF; font-size: 64px; }' +
                   'div#ui input, div#ui button { font-size: 100%; }' + 
                   '</style>');

    // Create the invisible UI pane over the top.  The background has
    // to have zero alpha for IE to pass mouse events through it.
    // We can't affect the opacity property of the ui div without also
    // affecting opacity of the contained elements.
    document.write('<div id="ui" oncontextmenu="return false" style="position: fixed; background: rgba(0,0,0,0);' +  
                   ((navigator.userAgent.indexOf('Firefox') === -1) ? 'z-order: 10;' : '') + 
                   '"></div>');
    ui = document.getElementById('ui');


    // The canvas object must be set before game.js is loaded so that 
    // top-level code can refer to it.
    canvas = document.getElementById('canvas');
    screenWidth = 100;
    screenHeight = 100;
    codeheart.canvas = canvas;
    _ch_ctx = canvas.getContext("2d");
    _ch_setOrientation();
}


/** Ensure that Array.indexOf is available.
    From http://www.tutorialspoint.com/javascript/array_indexof.htm */
if (! Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt /*, from*/) {
        var len = this.length;
        
        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) {
            from += len;
        }

        while (from < len) {
            if ((from in this) && (this[from] === elt)) {
                return from;
            }
            ++from;
        }
        return -1;
    };
}


var _ch_recentTouchList = new (function () {
    this.list = [];

    // Newest are at the end.  Only call for a single touch end event
    this.add = function (touch) {
        this.removeOld();
        this.list.push({x: touch.clientX, y: touch.clientY, time: currentTime()});
    };

    this.removeOld = function() {
        // iOS generates the mouse event 300 ms after the touch event
        var recent = currentTime() - 0.5;
        // Times are stored in order, so we can always just remove
        // from the head of the list until we hit a sufficiently
        // recent time.
        while ((this.list.length > 0) && (this.list[0].time < recent)) {
            this.list.pop();
        }
    };

    this.wasRecent = function (mouseEvent) {
        this.removeOld();
        for (var i = 0; i < this.list.length; ++i) {
            var t = this.list[i];
            // Sometimes the mouse event is triggered slightly away from the actual touch event
            if ((Math.abs(t.x - mouseEvent.clientX) <= 2) && (Math.abs(t.y - mouseEvent.clientY) <= 2)) {
                return true;
            }
        }
    };
})();


/** Virtual keyboard keys simulated for touch screens. */
var _ch_touchKeySet = new (function() {
    // List of all defined keys.  A key becomes active when its activeTouchIDs
    // array is non-empty and goes inactive when it becomes empty.
    this.list = [];

    var activeColor  = makeColor(1, 1, 0.5, 0.7);
    var defaultColor = makeColor(1, 1, 1, 0.5);
    var borderColor  = makeColor(0, 0, 0, 0.5);
    var textColor    = makeColor(0, 0, 0, 0.5);

    this.drawAll = function() {
        var i, touchKey, color, scale;
        for (i = 0; i < this.list.length; ++i) {
            touchKey = this.list[i];
            if (touchKey.label !== null) {
                if (isString(touchKey.label)) {
                    color = (touchKey.activeTouchIDs.length > 0) ? activeColor : defaultColor;
                    if (touchKey.radius > 0) {
                        // Circle
                        fillCircle(touchKey.x, touchKey.y, touchKey.radius, color);
                        strokeCircle(touchKey.x, touchKey.y, touchKey.radius, borderColor, 5);
                        fillText(touchKey.label, touchKey.x, touchKey.y, textColor, '' + touchKey.radius + 'px sans-serif', 'center', 'middle');
                    } else {
                        // Rectangle
                        fillRectangle(touchKey.x, touchKey.y, touchKey.width, touchKey.height, color, 10);
                        strokeRectangle(touchKey.x, touchKey.y, touchKey.width, touchKey.height, borderColor, 5, 10);
                        fillText(touchKey.label, touchKey.x + touchKey.width / 2, touchKey.y + touchKey.height / 2, textColor, 
                                 '' + touchKey.height + 'px sans-serif', 'center', 'middle');
                    }
                } else {
                    // An image label
                    if (touchKey.radius > 0) {
                        // Size to circle
                        scale = touchKey.radius / min(touchKey.label.width, touchKey.label.height);
                        drawTransformedImage(touchKey.label, touchKey.x,  touchKey.y, 0, scale, scale);
                    } else {
                        // Size to rectangle
                        scale = max(touchKey.width / touchKey.label.width,  
                                    touchKey.height / touchKey.label.height);
                        drawTransformedImage(touchKey.label, touchKey.x + touchKey.width / 2,  touchKey.y + touchKey.height / 2, 0, scale, scale);
                    }
                }
            }
        }
    };

    this.set = function (keyCode, x, y, width, height, radius, label) {
        if (label === undefined) {
            label = asciiCharacter(keyCode);
        }

        var touchKey = {keyCode: keyCode, x: x, y: y, width: width, 
                        height:height, radius: radius, label: label,
                        activeTouchIDs: []};
        var i = this.find(keyCode);
        if (i === -1) {
            // Insert new key
            this.list.push(touchKey);
        } else {
            // Replace the existing one...if the new one is different
            var old = this.list[i];
            if ((old.x !== touchKey.x) ||
                (old.y !== touchKey.y) ||
                (old.width !== touchKey.width) ||
                (old.height !== touchKey.height) ||
                (old.radius !== touchKey.radius) || 
                (old.label !== touchKey.label)) {

                // Fire the old key event so that any state associated with the
                // old key are assumed to be released.
                if (old.activeTouchIDs.length > 0) {
                    _ch_onKeyUp({keyCode: touchKey.keyCode});
                }

                // Replace it
                this.list.splice(i, 1, touchKey);
            }
        }
    };

    this.find = function(keyCode) {
        for (var i = 0; i < this.list.length; ++i) {
            if (keyCode === this.list[i].keyCode) {
                return i;
            }
        }
        return -1;
    };

    this.remove = function(keyCode) {
        var i = this.find(keyCode);
        if (i === -1) {
            // This key didn't exist anyway
            return false;
            //_ch_error("" + keyCode + " is not a currently set touchKey.");
        } else {
            var touchKey = this.list[i];
            // Signal a key up if this is active
            if (touchKey.activeTouchIDs && touchKey.activeTouchIDs.length > 0) {
                _ch_onKeyUp({keyCode: touchKey.keyCode});
            }

            // Remove the touch key
            this.list.splice(i, 1);
            return true;
        }
    };

    this.contains = function(touchKey, x, y) {
        if (touchKey.radius > 0) {
            // Circle
            x -= touchKey.x;
            y -= touchKey.y;
            return (x * x + y * y) < (touchKey.radius * touchKey.radius);
        } else {
            // Rectangle
            return (x >= touchKey.x) && 
                (y >= touchKey.y) &&
                (x < touchKey.x + touchKey.width) && 
                (y < touchKey.y + touchKey.height);
        }
    };

    // Returns an array of the keys containing this rectangle, or null
    // if there are none (to avoid allocating in the common case)
    this.containingKeys = function(x, y) {
        var keys = null;
        var touchKey;
        for (var i = 0; i < this.list.length; ++i) {
            touchKey = this.list[i];
            if (this.contains(touchKey, x, y)) {
                if (keys) {
                    keys.push(touchKey);
                } else {
                    // First allocation
                    keys = [touchKey];
                }
            }
        }
        return keys;
    };

    /** Returns true if the key was handled by touch start */
    this.onTouchStart = function(x, y, id) {
        //console.log("_ch_touchKeySet.onTouchStart(" + x + ", " + y + ", " + id + ")");
        if (_ch_isMobile && (id >= _ch_MOUSETOUCH_IDENTIFIER) && (id <= RIGHT_MOUSE_BUTTON_ID)) {
            // On mobile, avoid double-processing the touch start & end
            // (need a better way of handling this, since some devices
            // have both mouse and touch, and we need to distinguish
            // whether this is a synthetic or real mouse event)
            return false;
        }

        // Get the list of keys first, since user event handlers can
        // modify it.
        var handled = false;
        var keys = this.containingKeys(x, y);
        if (keys && (keys.length > 0)) {
            // For each touch key containing the touch position
            var touchKey;
           
            // Consider the event handled if there is any key touched
            handled = true;
            for (var i = 0; i < keys.length; ++i) {
                touchKey = keys[i];
                touchKey.activeTouchIDs.push(id);

                if (touchKey.activeTouchIDs.length === 1) {
                    // This was the first touch on this key, activate
                    // it by simulating a key press
                    _ch_onKeyDown({keyCode: touchKey.keyCode});
                }
            }
        }

        return handled;
    };

    // Returns an array of all touchKeys that are actively touched by this id,
    // If removeID is true, then removes the ID from their lists.
    // Returns null if there are no such touchKeys.
    this.touchKeysWithActiveId = function(id, removeID) {
        var keys = null;
        var touchKey;

        // Find all touchkeys that are currently using this id
        for (var i = 0; i < this.list.length; ++i) {
            touchKey = this.list[i];
            for (var t = 0; t < touchKey.activeTouchIDs.length; ++t) {
                if (touchKey.activeTouchIDs[t] === id) {
                    if (removeID) {
                        touchKey.activeTouchIDs.splice(t, 1);
                        --t;
                    }
                    if (keys) {
                        keys.push(touchKey);
                    } else {
                        keys = [touchKey];
                    }
                    continue;
                }
            }
        }
        return keys;
    };


    this.onTouchMove = function(x, y, id) {
        if (_ch_isMobile && (id >= _ch_MOUSETOUCH_IDENTIFIER) && (id <= RIGHT_MOUSE_BUTTON_ID)) {
            return {
                simulateTouchStart : false,
                simulateTouchEnd   : false,
                consumed           : false
            };
        }
        
        // First, disable keys that the touch just moved out of.  Get
        // the list of keys before processing callbacks, since user
        // event handlers can cause modifications to it.
        var keys = this.touchKeysWithActiveId(id, false);
        var touchKey;
        var i, j;

        var simulateTouchStart   = false;
        var simulateTouchEnd     = false;
        var consumed             = false;

        if (keys) {
            consumed = true;
            for (i = 0; i < keys.length; ++i) {
                touchKey = keys[i];
                if (! this.contains(touchKey, x, y)) {
                    // We just moved off of a touch key, potentially
                    // onto the screen. If this touch moved onto
                    // another key, then we'll turn off
                    // simulateTouchStart in the second major loop
                    // below.
                    simulateTouchStart = true;

                    // Remove the touch (we have to find it first)
                    for (j = 0; j < touchKey.activeTouchIDs.length; ++j) {
                        if (touchKey.activeTouchIDs[j] === id) {
                            touchKey.activeTouchIDs.splice(j, 1);
                            break;
                        }
                    }

                    if (touchKey.activeTouchIDs.length === 0) {
                        // This was the last touch on this key. Fire the key up event.
                        _ch_onKeyUp({keyCode: touchKey.keyCode});
                    }
                }
            }
        }

        // Now look for touch keys that were just entered and turn them on
        keys = this.containingKeys(x, y);
        if (keys) {
            consumed = true;

            var touchKey;
            for (var i = 0; i < keys.length; ++i) {
                touchKey = keys[i];
                // If not already active
                if (touchKey.activeTouchIDs.indexOf(id) === -1) {
                    // Turn on the key
                    touchKey.activeTouchIDs.push(id);
                    _ch_onKeyDown({keyCode: touchKey.keyCode});
                    
                    // If we didn't move here from another touch key, consider
                    // this the first movement onto keys and end the touch
                    // on the screen.
                    if (! simulateTouchStart) {
                        simulateTouchEnd = true;
                    }
                    
                    // Keep treating this as a touch key, don't reveal
                    // another start.
                    simulateTouchStart = false;
                }
            }
        }

        return {
            simulateTouchStart : simulateTouchStart,
            simulateTouchEnd   : simulateTouchEnd,
            consumed           : consumed
        };
    };

    /** Returns true if the event should be consumed by the key */
    this.onTouchEnd = function(x, y, id) {
        //console.log("_ch_touchKeySet.onTouchEnd(" + x + ", " + y + ", " + id + ")");
        if (_ch_isMobile && (id >= _ch_MOUSETOUCH_IDENTIFIER) && (id <= RIGHT_MOUSE_BUTTON_ID)) {
            // On mobile, avoid double-processing the touch start & end
            // (need a better way of handling this, since some devices
            // have both mouse and touch, and we need to distinguish
            // whether this is a synthetic or real mouse event)
            return false;
        }

        var handled = false;
        // Get the list of keys first, since user event handlers can
        // modify it.
        var keys = this.touchKeysWithActiveId(id, true);
        if (keys && (keys.length > 0)) {
            var touchKey;
            handled = true;
            for (var i = 0; i < keys.length; ++i) {
                touchKey = keys[i];
                if (touchKey.activeTouchIDs.length === 0) {
                    // This was the last touch on this key, deactivate
                    // it by simulating a key release
                    _ch_onKeyUp({keyCode: touchKey.keyCode});
                }
            }
        }
        return handled;
    };

})();


/** All touches that are currently active. */
var _ch_activeTouchIDSet = {};

/** Queue of sounds to be loaded.  This is needed on iOS because 
    sound loading/playing has to be triggered by a user event

    http://developer.apple.com/library/safari/#documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html

    http://paulbakaus.com/tutorials/html5/web-audio-on-ios/

    Processed by _ch_processSoundLoadQueue
*/
var _ch_soundLoadQueue = [];
var _ch_initializedAudio = false;

/** Loads all sounds in _ch_soundLoadQueue and empties it */
function _ch_processSoundLoadQueue() {
    if (_ch_soundLoadQueue.length === 0) { return; }

    if (_ch_isiOS) {
        if (_ch_initializedAudio) { return; }

        // Playing any sound will trigger unmuting audio
        var buffer = _ch_audioContext.createBuffer(1, 1, 22050);
        var source = _ch_audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(_ch_audioContext.destination);
        if (source.start) {
            source.start(0);
        } else {
            source.noteOn(0);
        }
        _ch_initializedAudio = true;

    } else {
        // This was for old iOS HTML Audio that could not load unless
        // there was a user event.  This path is no longer used, but
        // is kept in codeheart in case another platform later emerges
        // with the same problem.
        for (var i = 0; i < _ch_soundLoadQueue.length; ++i) {
            _ch_soundLoadQueue[i].load();
        }
    }

    // Wipe the queue
    _ch_soundLoadQueue = [];
}

function _ch_preventDefault(event) { event.preventDefault(); }

/** Used to stop touchmove events from scrolling */
function _ch_maybePreventDefault(event) { 
    if ((event.target === ui) || (event.target === document.body)) {
        event.preventDefault();
    }
}


///////////////////////////////////////////////////////////////////////////////////

/** codeheart.js puts a suffix of "?refresh=1" on many URLs to force
    them to reload, even if the browser has cached them. This
    is necessary during development to ensure that changes are reflected
    on some browsers and servers.  This function removes any suffix ending with "?" 
    when printing a call stack. */
function _ch_removeRefreshArguments(url) {
    var pattern = '?refresh=1';
    var i = url.indexOf(pattern);
    if (i !== -1) {
        return url.substring(0, i) + url.substring(i + pattern.length);
    } else {
        return url;
    }
}

/** Obtain a stacktrace from the current point in the program. The
    amount of information varies depending on the browser. */
function _ch_getStackTrace(e) {
    callstack = _ch_eriwen_getStackTrace({e:e});

    // Remove empty entries, references to codeheart, and '?refresh=1' from filenames
    for (var i = 0; i < callstack.length; ++i) {
        if ((callstack[i] === '') || 
            (callstack[i].indexOf('codeheart.js') !== -1) || 
            (callstack[i] === '[native code]')) {
            callstack.splice(i, 1);
            --i;
        } else {
            callstack[i] = _ch_removeRefreshArguments(callstack[i]);
        }
    }

    if (_ch_isSafari) {
        // Reformat Safari's call stack to look like that of other browsers
        for (var i = 0; i < callstack.length; ++i) {
            var c = callstack[i];
            var j = c.indexOf('@');
            if (j !== -1) {
                callstack[i] = ' at ' + c.substring(0, j) + ' (' + c.substring(j + 1) + ')';
            }
        }        
    }

    return callstack;
}


///////////////////////////////////////////////////////////////////////////////////

var _ch_showLoadingMessage = true;
var _ch_onLoadRan = false;
function _ch_onLoad() {
    _ch_onResize(null);

    if (_ch_showLoadingMessage) {
        fillText("Loading...", screenWidth / 2, screenHeight / 2, 
                 makeColor(0.5, 0.5, 0.5, 1.0),
                 "300px Arial", "center", "middle");
    }

    // Install event handlers for the game.  These do not call
    // user functions until in _ch_PLAY mode.

    // See http://help.dottoro.com/larrqqck.php for a list of all event types
    document.addEventListener("keydown",     _ch_onKeyDown,      false);
    document.addEventListener("keyup",       _ch_onKeyUp,        false);

    // If there is a ui plane, it will steal all mouse and touch
    // events from the canvas unless we attach the handlers to it
    var target = ui;

    // Track "up" events on the capturing (outside to inside) phase
    // so that they can be used to pre-emptively stop the event
    // before the window sees it.
    document.addEventListener("touchend", function() {}, false);
    document.addEventListener("click", function() {}, false);
    canvas.addEventListener("touchend", function() {}, false);
    canvas.addEventListener("click", function() {}, false);

    // The getEventCoordinates function assumes that these are on the
    // ui element.
    target.addEventListener  ("mousemove",   _ch_onMouseMove,    false);
    target.addEventListener  ("click",       _ch_onClick,        false);
    target.addEventListener  ("mousedown",   _ch_onMouseDown,    false);
    target.addEventListener  ("mouseup",     _ch_onMouseUp,      true);
    target.addEventListener  ("mousecancel", _ch_onMouseUp,      true);
    target.addEventListener  ("touchstart",  _ch_onTouchStart,   false);
    target.addEventListener  ("touchmove",   _ch_onTouchMove,    false);
    target.addEventListener  ("touchcancel", _ch_onTouchEnd,     true);
    target.addEventListener  ("touchend",    _ch_onTouchEnd,     true);
    target.addEventListener  ("wheel",       _ch_onWheel,        false);

    // Used for tracking whether a touch that started on the target
    // moved outside and then ended
    document.addEventListener("mouseup",     _ch_onWindowMouseUp, false);
    document.addEventListener("mousecancel", _ch_onWindowMouseUp, false);
    document.addEventListener("touchend",    _ch_onWindowTouchEnd, false);
    document.addEventListener("touchcancel", _ch_onWindowTouchEnd, false);

    window.addEventListener  ("resize",      _ch_onResize,       false);
    window.addEventListener  ("orientationchange", _ch_onResize, false);
    window.addEventListener  ("focus",       _ch_onFocusIn,      false);
    window.addEventListener  ("blur",        _ch_onFocusOut,     false);

    document.onselectstart = function() { return false; };

    // Prevent the page itself from scrolling or responding to other gestures on iOS
    // We do this by placing a huge invisible object in the background that covers
    // any empty space that the body does not.
    if (_ch_isMobile) {
        var body = document.getElementsByTagName('body')[0];        
        var consumer = document.getElementById('_ch_eventConsumer');

        // Proactively grab touch move events on empty background
        consumer.addEventListener("touchmove",  _ch_preventDefault, true);

        // Only grab touch move events that propagate on the background object
        body.addEventListener("touchmove",  _ch_maybePreventDefault, false); 

        // Leave other touch events (touchstart, touchcancel,
        // touchend) unmodified; they are needed for various GUI
        // controls to function
    }

    _ch_startTimer(30);
    _ch_onLoadRan = true;
}


/** Abstraction of starting the timer */
function _ch_startTimer(fps) {
    // We have to run slightly faster than
    // desired to actually hit the frame rate on average
    _ch_timer = setInterval(_ch_mainLoop, 1000 / fps - (_ch_isiOS ? 0.75 : 0.45));
}

/** Abstraction of stopping the timer */
function _ch_stopTimer() {
    clearInterval(_ch_timer);
}

/**
   <function name="drawCodeheartLogo" level="advanced" category="graphics">
   <param name="x" type="Number" optional="true"></param>
   <param name="y" type="Number" optional="true"></param>
   <description>
     Draws the codeheart.js logo at (<arg>x0</arg>, <arg>y0</arg>).
   </description>
   </function>
*/
/** Draw the codeheart.js logo */
function drawCodeheartLogo(x0, y0) {
    _ch_checkExactArgs(arguments, 0, "drawCodeheartLogo(x, y)");

    if (x0 === undefined) { x0 = 24; }
    if (y0 === undefined) { y0 = screenHeight - 66; }

    var color = ['rgba(0,0,0,0)', '#000', '#fff', '#ff441f', '#8c2511'];
    var w = 17, h = 10;
    var data = 
        [0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,
         0,1,0,0,1,3,3,1,0,1,3,3,1,0,0,1,0,
         0,1,0,1,3,2,2,3,1,3,3,3,3,1,0,1,0,
         0,1,0,1,3,2,3,3,3,3,3,3,3,1,0,1,0,
         1,0,0,1,3,3,3,3,3,3,3,3,3,1,0,0,1,
         0,1,0,0,1,3,3,3,3,3,3,3,1,0,0,1,0,
         0,1,0,0,0,1,3,3,3,3,3,1,0,0,0,1,0,
         0,1,0,0,0,0,1,3,3,3,1,0,0,0,0,1,0,
         0,1,0,0,0,0,0,1,3,1,0,0,0,0,0,1,0,
         0,1,1,0,0,0,0,0,1,0,0,0,0,0,1,1,0];

    var x, y;

    strokeRectangle(x0 - 12 - 1, y0 - 12 - 1, 300 + 2, 66 + 2, makeColor(1, 1, 1, 0.3), 2);
    fillRectangle(x0 - 12, y0 - 12, 300, 66, makeColor(1, 1, 1, 0.8));

    // Even-numbered pixel sizes downsample better in Safari
    var s = 4;
    var c;
    for (y = 0; y < h; ++y) {
        for (x = 0; x < w; ++x) {
            c = data[x + y * w];
            if (c > 0) {
                fillRectangle(x0 + x * s, y0 + y * s, s, s, color[c]);
            }
        }
    }
  
    fillText('made with', x0 + w * s + 6, y0 - 8, makeColor(0.4, 0.4, 0.4), '18px Helvetica, Arial', 'left', 'top');      
    fillText('codeheart', x0 + w * s + 6, y0 + h * s + 8, makeColor(0, 0, 0), '38px Helvetica, Arial', 'left', 'bottom');
    fillText('.js', x0 + w * s + 174, y0 + h * s + 8, color[3], '38px Helvetica, Arial', 'left', 'bottom');
}

/** Backwards compatibility to the pre-2014-08-27 version */
var _ch_drawLogo = drawCodeheartLogo;


/**
   Catmull-Rom equivalent of context.bezierTo
 */
function _ch_splineTo(ctx, C, close) {
    var x0, y0, x1, y1, x2, y2, d01, d02, a, b;
    var i;

    // Bezier control points in the form [x0, y0,  x1, y1,  ... ]
    var B = [];

    // Twice the number of points
    var n = C.length;

    // Compute all Bezier control points from Catmull-Rom control points
    for (i = 0; i < n; i += 2) {
        // Affecting points
        x0 = C[(i + 0 + n) % n];
        y0 = C[(i + 1 + n) % n];
        x1 = C[(i + 2 + n) % n];
        y1 = C[(i + 3 + n) % n];
        x2 = C[(i + 4 + n) % n];
        y2 = C[(i + 5 + n) % n];
        
        //  Distance between control points
        d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
   
        a = d01 / (2 * (d01 + d12));
        b = 0.5 - a;
        
        B.push( x1 + a * (x0 - x2),
                y1 + a * (y0 - y2),
                
                x1 - b * (x0 - x2),
                y1 - b * (y0 - y2) );
    }


    if (close) {
        // Closed curve
        var m = B.length;

        ctx.moveTo(C[2], C[3]);
        for (i = 0; i < B.length; i += 2){
            ctx.bezierCurveTo(B[(2 * i + 2) % m],
                              B[(2 * i + 3) % m],
                              B[(2 * i + 4) % m],
                              B[(2 * i + 5) % m],
                              C[(i + 4) % n], 
                              C[(i + 5) % n]);
        }

    } else {  
        // Open curve

        //  The first and last segments are quadratic curves
        ctx.moveTo(C[0], C[1]);
        ctx.quadraticCurveTo(B[0], B[1], C[2], C[3]);

        for (i = 2; i < n - 5; i += 2) {
            ctx.bezierCurveTo
            (B[2 * i - 2], B[2 * i - 1], 
             B[2 * i], B[2 * i + 1],
             C[i + 2], C[i + 3]);
        }
     
        ctx.quadraticCurveTo(B[2 * n - 10], B[2 * n - 9], C[n - 2], C[n - 1]);
    }
}

////////////////////////////////////////////////////////////////////////////
// Documentation stubs for user event handlers

/**
   <function name="onSetup" category="core">
     <description>
        If you define this function, codeheart.js will call it to set up the
        initial state of your game.
     </description>
     <return type="undefined">none</return>
   </function>  
*/


/**
   <function name="onTick" category="interaction">
     <description>
        If you define this function, codeheart.js will call it repeatedly.
        For a real-time game this is a good place to redraw the canvas
        and perform animation.  Use the <api>time</api> function to 
        discover the current (relative) time.
     </description>
     <return type="undefined">none</return>
   </function>
*/

/**
   <function name="onMouseMove" category="interaction">
      <description>
         Invoked when the mouse moves...only works on devices that have
         a mouse, trackpad, etc.  See also <api>onTouchMove</api>, 
         which is invoked during a mouse drag or touch drag.
      </description>
      <param name="x" type="Number"></param>
      <param name="y" type="Number"></param>
      <see><api>onTouchMove</api>, <api>onWheel</api></see>
   </function>
*/

/**
   <function name="onWheel" category="interaction">
      <description>
         Invoked when the mouse scroll wheel turns...only works on devices that have
         a mouse!
      </description>
      <param name="x" type="Number">Mouse position</param>
      <param name="y" type="Number">Mouse position</param>
      <param name="dx" type="Number">Horizontal scroll amount</param>
      <param name="dy" type="Number">Vertical scroll amount</param>
      <see><api>onTouchMove</api>, <api>onMouseMove</api></see>
   </function>
*/

/**
   <function name="onClick" category="interaction">
     <description>
       Created by a mouse click or touch and release.
       This occurs about 1/3 second after the actual touch release on 
       iOS.  Consider using <api>onTouchStart</api> instead if timing
       is important for your game.
     </description>
     <param name="x" type="Number"></param>
     <param name="y" type="Number"></param>
   </function>
*/

/**
   <function name="onTouchStart" category="interaction">
     <description>
       Invoked by a touch or mouse press beginning.
     </description>
     <param name="x" type="Number"></param>
     <param name="y" type="Number"></param>
     <param name="id" type="Number">Identifier distinguishing this touch from all others that are currently active. 
     When the touch is from a mouse, this is LEFT_MOUSE_BUTTON_ID or RIGHT_MOUSE_BUTTON_ID</param>
   </function>
*/

/**
   <function name="onTouchMove" category="interaction">
     <description>
       Invoked by moving with the mouse button down or 
       dragging fingers on a touch canvas.
     </description>
     <param name="x" type="Number"></param>
     <param name="y" type="Number"></param>
     <param name="id" type="Number">Identifier distinguishing this touch from all others that are currently active. 
     When the touch is from a mouse, this is LEFT_MOUSE_BUTTON_ID or RIGHT_MOUSE_BUTTON_ID</param>
     <see><api>onTouchStart</api>, <api>onTouchEnd</api></see>
   </function>
*/

/**
   <function name="onTouchEnd" category="interaction">
     <description>
       Created by a touch or mouse press ending.
     </description>
     <param name="x" type="Number"></param>
     <param name="y" type="Number"></param>
     <param name="id" type="Number">Identifier distinguishing this touch from all others that are currently active. 
     When the touch is from a mouse, this is LEFT_MOUSE_BUTTON_ID or RIGHT_MOUSE_BUTTON_ID</param>
   </function>
*/

/**
   <function name="onKeyStart" category="interaction">
     <description>
       <p>
       Occurs only once when a key is first pushed down.
       </p>
       <p>
     (Note that many browsers will send repeated HTML key down events, but
     codeheart.js reduces these to a single event.) 
       </p>
    </description>
    <param name="key" type="Number">The key code.</param>
  </function>
*/

/**
   <function name="onKeyEnd" category="interaction">
     <description>
       <p>
       Occurs when a key is released.
       </p>
    </description>
    <param name="key" type="Number">The key code.</param>
   </function>
*/


/**
   Applies fcn to the rest of the args, passing no 'this'.
   Catches all exceptions, displaying them and
   shutting off animation
 */
function _ch_safeApply() {
    try {
        var fcn = arguments[0];
        arguments[0] = null;
        Function.prototype.call.apply(fcn, arguments);
    } catch (e) {
        // Shut down animation
        _ch_stopTimer();

        var m;
        var st = _ch_getStackTrace(e);

        // Insert the name of the called function for the most recent safeApply
        var i = st.indexOf('_ch_safeApply()');
        if (i !== -1) {
            st.splice(i, 0, fcn.name + "()");
        }
        
        m = String(e) + '\n\n' + _ch_callStackToString(st);
        console.error(m);
        alert(m);
    }
}


function _ch_onFocusIn(event) {
    _ch_hasFocus = true;
}


function _ch_onFocusOut(event) {
    _ch_hasFocus = false;
}


function _ch_endFullscreen() {
    if (document.cancelFullScreen) {
        document.cancelFullScreen();
    } else if (document.cancelFullscreen) {
        document.cancelFullscreen();
    } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    } else if (document.msCancelFullScreen) {
        document.msCancelFullScreen();
    } else if (document.oCancelFullScreen) {
        document.oCancelFullScreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    }
}

// Not announced in the public API--reserved for future expansion
// through an auto-fullscreen button
function _ch_startFullscreen() {
    var element = document.documentElement;
    if (element.requestFullScreen) {
        element.requestFullScreen();
    } else if (element.requestFullscreen) {
        element.requestFullScreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.oRequestFullScreen) {
        element.oRequestFullScreen();
    } else if (element.msRequestFullScreen) {
        element.msRequestFullScreen();
    } else if (element.webkitRequestFullScreen  && ! _ch_isSafari) {
        // Safari does not support keyboard input in fullscreen mode,
        // so it is useless for many games
        element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
    }
    element.focus();
}


////////////////////////////////////////////////////////////////////////////
// The following event handlers only trigger user events if the user
// has defined the corresponding function.

function _ch_onResize(event) {
    // Window dimensions
    var ww, wh;

    if (_ch_isiOS) {
        // We need to force a scroll to remove the URL bar on iPhone
        window.scrollTo(0,0);

        // On iOS, we have to use innerWidth and innerHeight to
        // discount the space taken by the iPhone URL bar, which
        // will slide off screen.
        ww = window.innerWidth;
        wh = window.innerHeight;
    } else {
        // On IE9 in particular, window.innerWidth doesn't include
        // scrollbars; this does.  Using innerWidth causes IE to
        // display scrollbars and offset coordinates.
        ww = document.documentElement.clientWidth;
        wh = document.documentElement.clientHeight;
    }

    var needTransform = (_ch_maxResolution !== Math.min(screenWidth, screenHeight));

    if (needTransform) {
        // Adjust canvas resolution

        var old;

        if (_ch_maxResolution === "auto") {
            // Save the old image
            old = document.createElement('canvas');
            old.width = canvas.width;
            old.height = canvas.height;
            old.getContext("2d").drawImage(canvas, 0, 0);
        }

        // Adjust resolution
        var scale;
        if (_ch_maxResolution === "auto") {
            // Size based on window
            scale = Math.min(Math.min(screenWidth, ww) / screenWidth, 
                             Math.min(screenHeight, wh) / screenHeight);
        } else {
            // Size based on _ch_maxResolution
            if (screenWidth > screenHeight) {
                // Landscape
                scale = _ch_maxResolution / screenHeight;
            } else {
                // Portrait
                scale = _ch_maxResolution / screenWidth;
            }
        }

        canvas.width  = scale * screenWidth;
        canvas.height = scale * screenHeight;
        
        if (_ch_maxResolution === "auto") {
            // Stretch the old image
            _ch_ctx.setTransform(1, 0, 0, 1, 0, 0);
            _ch_ctx.drawImage(old, 0, 0, canvas.width, canvas.height);
        }

        // This should trigger garbage collection of the old image
        old = null;
    }

    // Set the zoom factor
    var cw = screenWidth;
    var ch = screenHeight;

    _ch_zoom = Math.min(ww / cw, wh / ch);

    if (needTransform) {
        // Adjust the screen scale.  Store the result in
        // _ch_baseTransform since context.currentTransform is not
        // widely supported yet.
        _ch_baseTransform = [canvas.width / screenWidth, 0, 
                             0, canvas.height / screenHeight, 
                             0, 0];

    
        _ch_ctx.setTransform.apply(_ch_ctx, _ch_baseTransform);
    } else {
        _ch_baseTransform = [1, 0, 0, 1, 0, 0];
    }

    var z = _ch_zoom;
    
    // Display size
    canvas.style.width = Math.round(cw * z) + 'px';
    canvas.style.height = Math.round(ch * z) + 'px';

    // Display offset
    var x = (ww - cw * z) / 2.0;
    var y = (wh - ch * z) / 2.0;
    canvas.style.left = Math.round(x) + 'px';
    canvas.style.top  = Math.round(y) + 'px';

    // Keep the UI pane sized appropriately
    ui.style.top    = canvas.style.top;
    ui.style.left   = canvas.style.left;

    // These are affected by the transform
    ui.style.width  = screenWidth + 'px';
    ui.style.height = screenHeight + 'px';

    var origin = 'top left';
    var xform = 'scale(' + _ch_zoom + ', ' + _ch_zoom + ')';
    ui.style['-webkit-transform-origin'] = origin;
    ui.style['-webkit-transform'] = xform;
    ui.style['-o-transform-origin'] = origin;
    ui.style['-o-transform'] = xform;
    ui.style['-ms-transform-origin'] = origin;
    ui.style['-ms-transform'] = xform;
    ui.style['transform-origin'] = origin;
    ui.style['transform'] = xform;
    ui.style.MozTransform = xform;
    ui.style.MozTransformOrigin = origin;

    // Invoke the user resize handler (secret API)
    if (typeof onResize === 'function') {
        _ch_safeApply(onResize);
    }
}


/* Table of keys that are currently down.  Used to suppress duplicate
   keyDown events. */
var _ch_activeKey = {};


function _ch_onClick(event) {
    // Make event relative to the control that was clicked
    if ((_ch_mode === _ch_PLAY) && (typeof onClick === "function")) {

        var c = _ch_getEventCoordinates(event);
        _ch_safeApply(onClick, c.x, c.y);

    } else if (_ch_mode === _ch_TITLE) {

        // Clicked to start
        _ch_mode = _ch_SETUP;

    }
    event.preventDefault();
}


function _ch_onWheel(event) {
    // Make event relative to the control that was clicked
    if ((_ch_mode === _ch_PLAY) && (typeof onWheel === "function")) {

        var c = _ch_getEventCoordinates(event);
        var dx = event.deltaX, dy = event.deltaY;
        if (event.deltaMode === 1) {
            // Scroll in "lines of text"
            dx *= 40;
            dy *= 40;
        } else if (event.deltaMode === 2) {
            // Scroll in "pages"
            dx *= screenWidth;
            dy *= screenHeight;
        }
        _ch_safeApply(onWheel, c.x, c.y, dx, dy);
    }
    event.preventDefault();
}


function _ch_onMouseDown(event) {
    if (_ch_isMobile) {
        // Suppress this fake, touch-generated event on a touch
        // device. This is a big hammer to work around a bug where
        // sometimes iOS Safari leaves the codeheart recent touch
        // event list corrupted. This code disables mouse events on
        // mobile devices that have both a mouse and a touch screen!
        event.preventDefault();
        return false;
    }

    if (_ch_recentTouchList.wasRecent(event)) {
        // Suppress this fake, touch-generated event on a touch device
        event.preventDefault();
        return;
    }

    // See http://www.quirksmode.org/js/events_properties.html#button
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent

    var touchID = _ch_MOUSETOUCH_IDENTIFIER + event.button;
    _ch_activeTouchIDSet[touchID] = true;

    if (_ch_mode === _ch_PLAY) {
        // Simulate a touch start
        var c = _ch_getEventCoordinates(event);

        if (! _ch_touchKeySet.onTouchStart(c.x, c.y, touchID) &&
            (typeof onTouchStart === "function")) {
            _ch_safeApply(onTouchStart, c.x, c.y, touchID);
        }
    }
}


/** A mouse up event occured off the canvas */
function _ch_onWindowMouseUp(event) {
    var touchID = _ch_MOUSETOUCH_IDENTIFIER + event.button;
    if (_ch_activeTouchIDSet[touchID]) {
        // This touch began on the canvas and then moved off, so we
        // need to notify codeheart so that it doesn't miss the mouse
        // up event.
        _ch_onMouseUp(event);
    } else {
        _ch_activeTouchIDSet[touchID] = false;
    }
}


function _ch_onWindowTouchEnd(event) {
    var anyOn = false;
    for (var i = 0; i < event.changedTouches.length; ++i) {
        var t = event.changedTouches[i];
        anyOn = anyOn || _ch_activeTouchIDSet[t.identifier];
    }

    if (anyOn) {
        _ch_onTouchEnd(event);
    }

    for (var i = 0; i < event.changedTouches.length; ++i) {
        var t = event.changedTouches[i];
        _ch_activeTouchIDSet[t.identifier] = false;
    }
}


function _ch_onMouseUp(event) {
    if (_ch_isMobile) {
        // Suppress this fake, touch-generated event on a touch
        // device. This is a big hammer to work around a bug where
        // sometimes iOS Safari leaves the codeheart recent touch
        // event list corrupted. This code disables mouse events on
        // mobile devices that have both a mouse and a touch screen!
        event.preventDefault();
        return false;
    }

    if (_ch_recentTouchList.wasRecent(event)) {
        // Suppress this fake, touch-generated event
        event.preventDefault();
        return;
    }

    _ch_processSoundLoadQueue();

    var touchID = _ch_MOUSETOUCH_IDENTIFIER + event.button;
    _ch_activeTouchIDSet[touchID] = false;

    if (_ch_mode === _ch_PLAY) {
        // Simulate a touch end
        var c = _ch_getEventCoordinates(event);
   
        if (! _ch_touchKeySet.onTouchEnd(c.x, c.y, touchID)
            && (typeof onTouchEnd === "function")) {
            _ch_safeApply(onTouchEnd, c.x, c.y, touchID);
        }
    }

    // Don't let the window see this event
    event.stopPropagation();
}


/** Return the position of an element relative to the document (from
    http://www.quirksmode.org/js/findpos.html) */
function _ch_getElementPosition(element) {
    var pos = {x: 0, y: 0};
    if (element.offsetParent) do {
        pos.x += element.offsetLeft;
        pos.y += element.offsetTop;
    } while (element = element.offsetParent);

    return pos;
}


/* Computes game-space event coordinates from a mouse Event */
function _ch_getEventCoordinates(event) {
    if (event.target === ui) {
        // Relative to the ui object
        return {x: Math.round((event.clientX - event.target.offsetLeft) / _ch_zoom), 
                y: Math.round((event.clientY - event.target.offsetTop) / _ch_zoom)};
    } else {
        // Relative to the window
        var offset = _ch_getElementPosition(ui);
        return {x: Math.round((event.clientX - offset.x) / _ch_zoom), 
                y: Math.round((event.clientY - offset.y) / _ch_zoom)};
    }

/*
    if (_ch_isOldIE) {
        // IE 9 applies zoom to the offset as well
        return {x: Math.round((event.clientX - event.target.offsetLeft) / _ch_zoom), 
                y: Math.round((event.clientY - event.target.offsetTop)  / _ch_zoom)};
    } else { 
        return {x: Math.round(event.clientX / _ch_zoom - event.target.offsetLeft), 
                y: Math.round(event.clientY / _ch_zoom - event.target.offsetTop)};
    }*/
}

/* Computes game-space event coordinates from a Touch */
function _ch_getTouchCoordinates(touch) {
    // Touch objects happen to have exactly the same properties as events
    return _ch_getEventCoordinates(touch);
}


function _ch_onMouseMove(event) {
    if (_ch_isMobile) {
        // Suppress this fake, touch-generated event on a touch
        // device. This is a big hammer to work around a bug where
        // sometimes iOS Safari leaves the codeheart recent touch
        // event list corrupted. This code disables mouse events on
        // mobile devices that have both a mouse and a touch screen!
        event.preventDefault();
        return false;
    }


    if (_ch_recentTouchList.wasRecent(event)) {
        // Suppress this fake, touch-generated event
        event.preventDefault();
        return;
    }

    if (_ch_mode === _ch_PLAY) {
        var c = _ch_getEventCoordinates(event);

        if (typeof onMouseMove === "function") {
            // Make event relative to the control that was clicked
            _ch_safeApply(onMouseMove, c.x, c.y);
        }

        if (_ch_activeTouchIDSet[_ch_MOUSETOUCH_IDENTIFIER] || _ch_activeTouchIDSet[_ch_MOUSETOUCH_IDENTIFIER + 2]) {
            // Simulate a touchMove

            var r;
            if (_ch_activeTouchIDSet[_ch_MOUSETOUCH_IDENTIFIER]) { r = _ch_touchKeySet.onTouchMove(c.x, c.y, _ch_MOUSETOUCH_IDENTIFIER); }
            
            for (var i = 0; i < 2; ++i) {
                if (((i === 0) && _ch_activeTouchIDSet[_ch_MOUSETOUCH_IDENTIFIER]) || 
                    ((i === 1) && _ch_activeTouchIDSet[_ch_MOUSETOUCH_IDENTIFIER + 2])) {
                    if (r.simulateTouchStart && (typeof onTouchStart === "function")) {
                        _ch_safeApply(onTouchStart, c.x, c.y, _ch_MOUSETOUCH_IDENTIFIER + 2 * i);
                    }
                    
                    if (r.simulateTouchEnd && (typeof onTouchEnd === "function")) {
                        _ch_safeApply(onTouchEnd, c.x, c.y, _ch_MOUSETOUCH_IDENTIFIER + 2 * i);
                    }
                    
                    if (! r.consumed && (typeof onTouchMove === "function")) {
                        _ch_safeApply(onTouchMove, c.x, c.y, _ch_MOUSETOUCH_IDENTIFIER + 2 * i);
                    }
                }

                if (_ch_activeTouchIDSet[_ch_MOUSETOUCH_IDENTIFIER + 2]) { 
                    r = _ch_touchKeySet.onTouchMove(c.x, c.y, _ch_MOUSETOUCH_IDENTIFIER + 2); 
                }
            }
        }
    }

    event.preventDefault();
}


function _ch_onKeyDown(event) {
    if (document.activeElement.tagName === 'INPUT') {
        // The focus is on a GUI element; codeheart.js should ignore the keyboard event
        return;
    }

    var key = event.keyCode;

    // undefined will correctly act as false in this expression
    if (! _ch_activeKey[key]) {
        _ch_activeKey[key] = true;

        if (_ch_mode === _ch_TITLE) {
            // Pressed a key to start
            _ch_mode = _ch_SETUP;
            
        } else if ((_ch_mode === _ch_PLAY) && (typeof onKeyStart === "function")) {

            // First key down event for this key
            _ch_safeApply(onKeyStart, key);
        }
    }

    if (event.preventDefault !== undefined) {
        // Codeheart intentionally swallows most key events to prevent
        // them from affecting the browser.
        //
        // However, we don't prevent default on quit, reload, or close
        // window keys.
        if (!(((event.metaKey || event.ctrlKey) && 
               ((event.keyCode === asciiCode("W")) ||
                (event.keyCode === asciiCode("R")) ||
                (event.keyCode === asciiCode("Q")) ||
                (event.keyCode === asciiCode("T")) ||
                (event.keyCode === asciiCode("N")))) ||
              (event.keyCode === 116) || // F5: IE reload
              (event.keyCode === 123))) { // F12: IE dev tool
                event.preventDefault();
        }
    }
}


function _ch_onKeyUp(event) {
    if (document.activeElement.tagName === 'INPUT') {
        // The focus is on a GUI element; codeheart.js should ignore the keyboard event
        return;
    }

    var key = event.keyCode;
    
    // Don't delete the property--that would be slower than just
    // setting to false
    _ch_activeKey[key] = false;

    if ((_ch_mode === _ch_PLAY) && (typeof onKeyEnd === "function")) {
        _ch_safeApply(onKeyEnd, key);
    }

    // _ch_onKeyUp is invoked with a fake event by touchkeys
    if (event.preventDefault !== undefined) {
        event.preventDefault();
    }
}


// See http://developer.apple.com/library/ios/#DOCUMENTATION/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html
// http://developer.apple.com/library/safari/#documentation/UserExperience/Reference/TouchClassReference/Touch/Touch.html#//apple_ref/javascript/cl/Touch
function _ch_onTouchStart(event) {
    //console.log("_ch_onTouchStart %o", event.changedTouches);
    _ch_processSoundLoadQueue();

    for (var i = 0; i < event.changedTouches.length; ++i) {
        var t = event.changedTouches[i];
        var c = _ch_getTouchCoordinates(t);

        _ch_activeTouchIDSet[t.identifier] = true;

        if ((_ch_mode === _ch_PLAY) &&
            (! _ch_touchKeySet.onTouchStart(c.x, c.y, t.identifier) &&
             (typeof onTouchStart === "function"))) {
            _ch_safeApply(onTouchStart, c.x, c.y, t.identifier);
        }
    }

    event.stopPropagation();

    // Prevent default is needed on iOS to prevent a non-moving touch from
    // thinking that it is selection and precluding all future touches.
    event.preventDefault();
}


function _ch_onTouchMove(event) {
    if (_ch_mode === _ch_PLAY) {
        for (var i = 0; i < event.changedTouches.length; ++i) {
            var t = event.changedTouches[i];
            var c = _ch_getTouchCoordinates(t);
            
            var r = _ch_touchKeySet.onTouchMove(c.x, c.y, t.identifier);

            if (r.simulateTouchStart && (typeof onTouchStart === "function")) {
                _ch_safeApply(onTouchStart, c.x, c.y, t.identifier);
            }

            if (r.simulateTouchEnd && (typeof onTouchEnd === "function")) {
                _ch_safeApply(onTouchEnd, c.x, c.y, t.identifier);
            }
            
            if (! r.consumed &&
                (typeof onTouchMove === "function")) {
                _ch_safeApply(onTouchMove, c.x, c.y, t.identifier);
            }
        }
    }

    // Prevent scrolling the large window on iOS
    _ch_maybePreventDefault(event);
}


function _ch_onTouchEnd(event) {
    //console.log("_ch_onTouchEnd %o", event.changedTouches);
    for (var i = 0; i < event.changedTouches.length; ++i) {
        var t = event.changedTouches[i];
        var c = _ch_getTouchCoordinates(t);
        
        _ch_activeTouchIDSet[t.identifier] = false;
        
        if ((_ch_mode === _ch_PLAY) &&
            (! _ch_touchKeySet.onTouchEnd(c.x, c.y, t.identifier) &&
             (typeof onTouchEnd === "function"))) {
            _ch_safeApply(onTouchEnd, c.x, c.y, t.identifier);
        }
    }

    event.stopPropagation();

    if (event.changedTouches.length === 1) {
        // This was a single touch ending.  It might later trigger a
        // click (which is good) or a fake
        // mouseDown/mouseMove/mouseDown (which is bad).
        _ch_recentTouchList.add(event.changedTouches[0]);
    }
}


/** <variable name="actualFramerate" type="Number" category="interaction" level="advanced">
    <description>
      The current rate at which onTick is being invoked in frames per second.  This may 
      fall below 30 if you are performing extensive rendering or other computation.
      </description>
    </variable> */
var actualFramerate = 30;
var _ch_frameTimeArray = makeArray(30);
function _ch_mainLoop() {
    // Advance the frame timer
    var now  = currentTime();
    var then = _ch_frameTimeArray.shift();
    _ch_frameTimeArray.push(now);

    if (then) {
        actualFramerate = round(_ch_frameTimeArray.length / (now - then));
    }

    if (_ch_pauseWhenUnfocused && ! _ch_hasFocus) {
        return;
    }

    _ch_processGamepads();

    if (_ch_mode === _ch_INIT) {
        _ch_mode = _ch_TITLE;
        
        if (_ch_isMobile) {
            // Try to scroll away the title bar on iOS; scrolling
            // other browsers doesn't hurt.
            window.scrollTo(0, 0);
            _ch_onResize(null);
        }
    }

    if (_ch_mode === _ch_TITLE) {
        if ((! _ch_showTitleScreen) || (_ch_gameName === undefined)) {
            // There is no title canvas
            _ch_mode = _ch_SETUP;
        } else {
            _ch_drawTitleScreen();

            // Test for gamepad buttons
            if (navigator.getGamepads) {
                var list = navigator.getGamepads();
                for (var j = 0; j < list.length; ++j) {
                    var gamepad = list[j];
                    if (gamepad) {
                        for (var i = 0; i < gamepad.buttons.length; ++i) {
                            if (isNumber(gamepad.buttons[i])) {
                                // Old API
                                if (gamepad.buttons[i] > 0.5) {
                                    _ch_mode = _ch_SETUP;
                                }
                            } else if (gamepad.buttons[i].value > 0.5) { 
                                // Newer API
                                _ch_mode = _ch_SETUP;
                            }
                        }
                    }
                }
            } // if gamepads
        }
    }

    if (_ch_mode === _ch_SETUP) {
        // In case setup itself calls reset(),
        // set the mode to play *first*
        _ch_mode = _ch_PLAY;
        if (typeof onSetup === "function") {
            _ch_safeApply(onSetup);
        }
    }
    

    if (_ch_mode === _ch_PLAY) {
        if (typeof onTick === "function") {
            _ch_safeApply(onTick);
        }
    }
}

/**
   <function name="drawTouchKeys" category="graphics">
     <description>
       Draws the labels of the touch keys.
     </description>
   </function>
 */
function drawTouchKeys() {
    _ch_touchKeySet.drawAll();
}


function _ch_drawTitleScreen() {
    clearRectangle(0, 0, screenWidth, screenHeight);
    
    if (_ch_titleScreenImage) {
        drawImage(_ch_titleScreenImage, 0, 0, screenWidth, screenHeight);
    } else {
        fillRectangle(0, 0, screenWidth, screenHeight, makeColor(1,1,1));
        fillText(_ch_gameName, screenWidth / 2, screenHeight / 2 - 100, makeColor(0.5, 0.5, 0.5,1), 
                 "200px Arial", "center", "middle");
        fillText("by " + _ch_authorName, screenWidth / 2, screenHeight / 2 + 200,  
                 makeColor(0.5,0.5,0.5,1), "100px Arial", "center", "middle");
    }

    _ch_drawLogo();
    
    var message = (_ch_touchScreen() ? "Touch" : "Click") + " to Play";
    var c = Math.abs((currentTime() * 1000 % 2000) - 1000) / 1000;
    fillText(message, screenWidth / 2, screenHeight - 100,
             makeColor(c,c,c,1), 
             "100px Arial", "center", "bottom");
}


/** True if this device has a touch interface */
function _ch_touchScreen() {
    return _ch_isiOS;//typeof TouchEvent !== "undefined";
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// from https://github.com/eriwen/javascript-stacktrace
// Domain Public by Eric Wendelin http://eriwen.com/ (2008)
//                  Luke Smith http://lucassmith.name/ (2008)
//                  Loic Dachary <loic@dachary.org> (2008)
//                  Johan Euphrosine <proppy@aminche.com> (2008)
//                  Oyvind Sean Kinsey http://kinsey.no/blog (2010)
//                  Victor Homyakov <victor-homyakov@users.sourceforge.net> (2010)

/**
 * Main function giving a function stack trace with a forced or passed in Error
 *
 * @cfg {Error} e The error to create a stacktrace from (optional)
 * @cfg {Boolean} guess If we should try to resolve the names of anonymous functions
 * @return {Array} of Strings with functions, lines, files, and arguments where possible
 */
function _ch_eriwen_getStackTrace(options) {
    options = options || {guess: true};
    var ex = options.e || null, guess = !!options.guess;
    var p = new _ch_eriwen_getStackTrace.implementation(), result = p.run(ex);
    return (guess) ? p.guessAnonymousFunctions(result) : result;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = _ch_eriwen_getStackTrace;
}

_ch_eriwen_getStackTrace.implementation = function() {
};

_ch_eriwen_getStackTrace.implementation.prototype = {
    /**
     * @param {Error} ex The error to create a stacktrace from (optional)
     * @param {String} mode Forced mode (optional, mostly for unit tests)
     */
    run: function(ex, mode) {
        ex = ex || this.createException();
        // examine exception properties w/o debugger
        //for (var prop in ex) {alert("Ex['" + prop + "']=" + ex[prop]);}
        mode = mode || this.mode(ex);
        if (mode === 'other') {
            return this.other(arguments.callee);
        } else {
            return this[mode](ex);
        }
    },

    createException: function() {
        try {
            this.undef();
        } catch (e) {
            return e;
        }
    },

    /**
     * Mode could differ for different exception, e.g.
     * exceptions in Chrome may or may not have arguments or stack.
     *
     * @return {String} mode of operation for the exception
     */
    mode: function(e) {
        if (e['arguments'] && e.stack) {
            return 'chrome';
        } else if (e.stack && e.sourceURL) {
            return 'safari';
        } else if (e.stack && e.number) {
            return 'ie';
        } else if (typeof e.message === 'string' && typeof window !== 'undefined' && window.opera) {
            // e.message.indexOf("Backtrace:") > -1 -> opera
            // !e.stacktrace -> opera
            if (!e.stacktrace) {
                return 'opera9'; // use e.message
            }
            // 'opera#sourceloc' in e -> opera9, opera10a
            if (e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
                return 'opera9'; // use e.message
            }
            // e.stacktrace && !e.stack -> opera10a
            if (!e.stack) {
                return 'opera10a'; // use e.stacktrace
            }
            // e.stacktrace && e.stack -> opera10b
            if (e.stacktrace.indexOf("called from line") < 0) {
                return 'opera10b'; // use e.stacktrace, format differs from 'opera10a'
            }
            // e.stacktrace && e.stack -> opera11
            return 'opera11'; // use e.stacktrace, format differs from 'opera10a', 'opera10b'
        } else if (e.stack) {
            return 'firefox';
        }
        return 'other';
    },

    /**
     * Given a context, function name, and callback function, overwrite it so that it calls
     * _ch_eriwen_getStackTrace() first with a callback and then runs the rest of the body.
     *
     * @param {Object} context of execution (e.g. window)
     * @param {String} functionName to instrument
     * @param {Function} function to call with a stack trace on invocation
     */
    instrumentFunction: function(context, functionName, callback) {
        context = context || window;
        var original = context[functionName];
        context[functionName] = function instrumented() {
            callback.call(this, _ch_eriwen_getStackTrace().slice(4));
            return context[functionName]._instrumented.apply(this, arguments);
        };
        context[functionName]._instrumented = original;
    },

    /**
     * Given a context and function name of a function that has been
     * instrumented, revert the function to its original (non-instrumented)
     * state.
     *
     * @param {Object} context of execution (e.g. window)
     * @param {String} functionName to de-instrument
     */
    deinstrumentFunction: function(context, functionName) {
        if (context[functionName].constructor === Function &&
                context[functionName]._instrumented &&
                context[functionName]._instrumented.constructor === Function) {
            context[functionName] = context[functionName]._instrumented;
        }
    },

    /**
     * Given an Error object, return a formatted Array based on Chrome's stack string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    chrome: function(e) {
        var stack = (e.stack + '\n').replace(/^\S[^\(]+?[\n$]/gm, '').
          replace(/^\s+(at eval )?at\s+/gm, '').
          replace(/^([^\(]+?)([\n$])/gm, '{anonymous}()@$1$2').
          replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1').split('\n');
        stack.pop();
        return stack;
    },

    /**
     * Given an Error object, return a formatted Array based on Safari's stack string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    safari: function(e) {
        return e.stack.replace(/\[native code\]\n/m, '')
            .replace(/^(?=\w+Error\:).*$\n/m, '')
            .replace(/^@/gm, '{anonymous}()@')
            .split('\n');
    },

    /**
     * Given an Error object, return a formatted Array based on IE's stack string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    ie: function(e) {
        var lineRE = /^.*at (\w+) \(([^\)]+)\)$/gm;
        return e.stack.replace(/at Anonymous function /gm, '{anonymous}()@')
            .replace(/^(?=\w+Error\:).*$\n/m, '')
            .replace(lineRE, '$1@$2')
            .split('\n');
    },

    /**
     * Given an Error object, return a formatted Array based on Firefox's stack string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    firefox: function(e) {
        return e.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^[\(@]/gm, '{anonymous}()@').split('\n');
    },

    opera11: function(e) {
        var ANON = '{anonymous}', lineRE = /^.*line (\d+), column (\d+)(?: in (.+))? in (\S+):$/;
        var lines = e.stacktrace.split('\n'), result = [];

        for (var i = 0, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
                var location = match[4] + ':' + match[1] + ':' + match[2];
                var fnName = match[3] || "global code";
                fnName = fnName.replace(/<anonymous function: (\S+)>/, "$1").replace(/<anonymous function>/, ANON);
                result.push(fnName + '@' + location + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
            }
        }

        return result;
    },

    opera10b: function(e) {
        // "<anonymous function: run>([arguments not available])@file://localhost/G:/js/stacktrace.js:27\n" +
        // "_ch_eriwen_getStackTrace([arguments not available])@file://localhost/G:/js/stacktrace.js:18\n" +
        // "@file://localhost/G:/js/test/functional/testcase1.html:15"
        var lineRE = /^(.*)@(.+):(\d+)$/;
        var lines = e.stacktrace.split('\n'), result = [];

        for (var i = 0, len = lines.length; i < len; i++) {
            var match = lineRE.exec(lines[i]);
            if (match) {
                var fnName = match[1]? (match[1] + '()') : "global code";
                result.push(fnName + '@' + match[2] + ':' + match[3]);
            }
        }

        return result;
    },

    /**
     * Given an Error object, return a formatted Array based on Opera 10's stacktrace string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    opera10a: function(e) {
        // "  Line 27 of linked script file://localhost/G:/js/stacktrace.js\n"
        // "  Line 11 of inline#1 script in file://localhost/G:/js/test/functional/testcase1.html: In function foo\n"
        var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
        var lines = e.stacktrace.split('\n'), result = [];

        for (var i = 0, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
                var fnName = match[3] || ANON;
                result.push(fnName + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
            }
        }

        return result;
    },

    // Opera 7.x-9.2x only!
    opera9: function(e) {
        // "  Line 43 of linked script file://localhost/G:/js/stacktrace.js\n"
        // "  Line 7 of inline#1 script in file://localhost/G:/js/test/functional/testcase1.html\n"
        var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
        var lines = e.message.split('\n'), result = [];

        for (var i = 2, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
                result.push(ANON + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
            }
        }

        return result;
    },

    // Safari 5-, IE 9-, and others
    other: function(curr) {
        var ANON = '{anonymous}', fnRE = /function\s*([\w\-$]+)?\s*\(/i, stack = [], fn, args, maxStackSize = 10;
        while (curr && curr['arguments'] && stack.length < maxStackSize) {
            fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
            args = Array.prototype.slice.call(curr['arguments'] || []);
            stack[stack.length] = fn + '(' + this.stringifyArguments(args) + ')';
            curr = curr.caller;
        }
        return stack;
    },

    /**
     * Given arguments array as a String, subsituting type names for non-string types.
     *
     * @param {Arguments} args
     * @return {Array} of Strings with stringified arguments
     */
    stringifyArguments: function(args) {
        var result = [];
        var slice = Array.prototype.slice;
        for (var i = 0; i < args.length; ++i) {
            var arg = args[i];
            if (arg === undefined) {
                result[i] = 'undefined';
            } else if (arg === null) {
                result[i] = 'null';
            } else if (arg.constructor) {
                if (arg.constructor === Array) {
                    if (arg.length < 3) {
                        result[i] = '[' + this.stringifyArguments(arg) + ']';
                    } else {
                        result[i] = '[' + this.stringifyArguments(slice.call(arg, 0, 1)) + '...' + this.stringifyArguments(slice.call(arg, -1)) + ']';
                    }
                } else if (arg.constructor === Object) {
                    result[i] = '#object';
                } else if (arg.constructor === Function) {
                    result[i] = '#function';
                } else if (arg.constructor === String) {
                    result[i] = '"' + arg + '"';
                } else if (arg.constructor === Number) {
                    result[i] = arg;
                }
            }
        }
        return result.join(',');
    },

    sourceCache: {},

    /**
     * @return the text from a given URL
     */
    ajax: function(url) {
        var req = this.createXMLHTTPObject();
        if (req) {
            try {
                req.open('GET', url, false);
                //req.overrideMimeType('text/plain');
                //req.overrideMimeType('text/javascript');
                req.send(null);
                //return req.status == 200 ? req.responseText : '';
                return req.responseText;
            } catch (e) {
            }
        }
        return '';
    },

    /**
     * Try XHR methods in order and store XHR factory.
     *
     * @return <Function> XHR function or equivalent
     */
    createXMLHTTPObject: function() {
        var xmlhttp, XMLHttpFactories = [
            function() {
                return new XMLHttpRequest();
            }, function() {
                return new ActiveXObject('Msxml2.XMLHTTP');
            }, function() {
                return new ActiveXObject('Msxml3.XMLHTTP');
            }, function() {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        ];
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
                // Use memoization to cache the factory
                this.createXMLHTTPObject = XMLHttpFactories[i];
                return xmlhttp;
            } catch (e) {
            }
        }
    },

    /**
     * Given a URL, check if it is in the same domain (so we can get the source
     * via Ajax).
     *
     * @param url <String> source url
     * @return False if we need a cross-domain request
     */
    isSameDomain: function(url) {
        return typeof location !== "undefined" && url.indexOf(location.hostname) !== -1; // location may not be defined, e.g. when running from nodejs.
    },

    /**
     * Get source code from given URL if in the same domain.
     *
     * @param url <String> JS source URL
     * @return <Array> Array of source code lines
     */
    getSource: function(url) {
        // TODO reuse source from script tags?
        if (!(url in this.sourceCache)) {
            this.sourceCache[url] = this.ajax(url).split('\n');
        }
        return this.sourceCache[url];
    },

    guessAnonymousFunctions: function(stack) {
        for (var i = 0; i < stack.length; ++i) {
            var reStack = /\{anonymous\}\(.*\)@(.*)/,
                reRef = /^(.*?)(?::(\d+))(?::(\d+))?(?: -- .+)?$/,
                frame = stack[i], ref = reStack.exec(frame);

            if (ref) {
                var m = reRef.exec(ref[1]);
                if (m) { // If falsey, we did not get any file/line information
                    var file = m[1], lineno = m[2], charno = m[3] || 0;
                    if (file && this.isSameDomain(file) && lineno) {
                        var functionName = this.guessAnonymousFunction(file, lineno, charno);
                        stack[i] = frame.replace('{anonymous}', functionName);
                    }
                }
            }
        }
        return stack;
    },

    guessAnonymousFunction: function(url, lineNo, charNo) {
        var ret;
        try {
            ret = this.findFunctionName(this.getSource(url), lineNo);
        } catch (e) {
            ret = 'getSource failed with url: ' + url + ', exception: ' + e.toString();
        }
        return ret;
    },

    findFunctionName: function(source, lineNo) {
        // FIXME findFunctionName fails for compressed source
        // (more than one function on the same line)
        // function {name}({args}) m[1]=name m[2]=args
        var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
        // {name} = function ({args}) TODO args capture
        // /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*function(?:[^(]*)/
        var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
        // {name} = eval()
        var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
        // Walk backwards in the source lines until we find
        // the line which matches one of the patterns above
        var code = "", line, maxLines = Math.min(lineNo, 20), m, commentPos;
        for (var i = 0; i < maxLines; ++i) {
            // lineNo is 1-based, source[] is 0-based
            line = source[lineNo - i - 1];
            commentPos = line.indexOf('//');
            if (commentPos >= 0) {
                line = line.substr(0, commentPos);
            }
            // TODO check other types of comments? Commented code may lead to false positive
            if (line) {
                code = line + code;
                m = reFunctionExpression.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
                m = reFunctionDeclaration.exec(code);
                if (m && m[1]) {
                    //return m[1] + "(" + (m[2] || "") + ")";
                    return m[1];
                }
                m = reFunctionEvaluation.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
            }
        }
        return '(?)';
    }
};

//
// end from https://github.com/eriwen/javascript-stacktrace
////////////////////////////////////////////////////////////////////////////////////////////////////
            

function _ch_callStackToString(stack) {
    var formattedStack = '';
    var frame;

    // Hide all _ch_ methods
    for (var i = 0; i < stack.length; ++i) {
        frame = stack[i];
        if (((frame.indexOf('codeheart.js') === -1) && (frame.indexOf('_ch_') === -1)) &&
            // Chrome includes the exception at the top of the error message
            ! (_ch_isChrome && (i === 0) && (frame.indexOf('Error:') !== -1))) {
            formattedStack += ' ' + frame + '\n';
        }
    }
    return formattedStack;
}


function _ch_error(message) {    
    _ch_stopTimer();
    throw new Error(message + '\n\n' + _ch_callStackToString(_ch_getStackTrace()));
}


/** Requires the ID to be a valid property name that doesn't conflict
    with __proto__ or other built-in properties so that we can use objects as maps. */
function _ch_checkID(id) {
    if ((typeof id !== 'string') ||
        (id.length === 0) ||
        (id[0] === '_')) {
        _ch_error('Illegal ID: ' + id);
    }
}


/** Checks to see if the minimum number of arguments was provided. */
function _ch_checkArgs(args, count, message) {
    if (args.length < count) {
        _ch_error(message + " requires at least " + count + " arguments.  ");
    }
}


/** Checks to see if exactly the right number of arguments are provided */
function _ch_checkExactArgs(args, count, message) {
    if (args.length !== count) {
        _ch_error(message + " requires exactly " + count + " arguments.  ");
    }
}


/** <function name="assert" category="core">
    <description>
      <p>
        A debugging statement that asserts some test expression evaluated to true. If it did not,
        halts your program with an error message to allow debugging.
      </p>
      <p>
        There is no way to completely elminate assertions in Javascript, unlike most other languages.
        This means that assertions potentially slow down production code. Of course, Javascript isn't
        as fast as other languages to begin with, and it doesn't help to have fast code that is wrong,
        so the benefits of an assertion often outweigh the performance cost. In production code,
        you can attempt to disable your assertions by putting the following statement in your
        <api>onSetup</api> function:
        <pre>
           assert = function() {};
        </pre>

        That line will cause many Javascript compilers will eliminate
        your assertions completely, provided that the test does not change any data structures.
        You can also wrap them in conditionals:

        <pre>
           if (DEBUG) { assert(...); }
        </pre>
      </p>
      <p>
        Unlike the console.assert built into many browsers, this stops the codeheart.js animation
        timer and formats the call stack.
      </p>
    </description>
    <param name="test" type="boolean">If the code is working correctly, then this value should be true</param>
    <param name="message" type="any">Message to be displayed.</param>
    </function>
 */
var assert = function(test, message) { 
    if (! test) {
        _ch_error(message || '');
    }
};


// I chose a 3:2 aspect ratio to fit reasonably on phone, tablet, and
// desktop.
var _ch_LONG_LENGTH  = 1920;
var _ch_SHORT_LENGTH = 1280;

/* 
    Autodetect the native resolution of the window and expose it to
    codeheart, violating our usual resolution scheme.

    Call this at top level right before defineGame.
    Provided for advanced use but not supported or exposed in the API. 
*/
function _ch_setAspectRatioFromWindow() {

    var w, h;
    if (window && window.innerWidth) {
        w = window.innerWidth;
        h = window.innerHeight;
    } else {
        w = document.body.clientWidth;
        h = document.body.clientHeight;
    }

    _ch_SHORT_LENGTH = 1280;
    _ch_LONG_LENGTH  = Math.ceil(_ch_SHORT_LENGTH * Math.max(w, h) / Math.min(w, h));
}


function _ch_setOrientation() {
    if (toUpperCase(_ch_orientation) === "V") {
        screenWidth  = _ch_SHORT_LENGTH;
        screenHeight = _ch_LONG_LENGTH;
    } else {
        screenWidth  = _ch_LONG_LENGTH;
        screenHeight = _ch_SHORT_LENGTH;
    }

    // Set the resolution to match (resize will adjust it appropriately)
    canvas.width  = screenWidth;
    canvas.height = screenHeight;

    _ch_onResize(null);
}

//--------------------------------------------------------------------
// Library of functions wrapping the JavaScript API for the game programmer

/** <function name="console.log" category="core">
    <description>
       <p>
         Shows a message in the developer console (not visible to the player).
         This is helpful for debugging.  This
         shows the line number of your own program, which is helpful for later
         finding while line was printing.
       </p>
       <p>
           You can provide multiple arguments if the message contains
           special formatting characters. This allows interactively inspecting object and
           array values in the browser console. Example:
           <pre>
              console.log("Position = %o", pos);
           </pre>
       </p>
    </description>
    <param name="message" type="any">Message to be displayed</param>
    </function>
*/

/**
   <function name="alert" category="interaction">
   <description>
   Show a popup message to the player and block (i.e., pause execution) until the "ok" button is pressed.
   </description>
   <param name="message" type="any">The message</param>
   <see><api>prompt</api>, <api>confirm</api>, <api>console.log</api></see>
   </function>
 */

/**
   <function name="confirm" category="interaction">
   <description>
     Show a popup message to the player and block (i.e., pause execution) until the "ok" or "cancel" 
     button is pressed.
   </description>
   <param name="message" type="any">The message</param>
   <return type="Boolean">True if the player pressed ok</return>
   <see><api>prompt</api>, <api>alert</api></see>
   </function>
 */

/**
   <function name="prompt" category="interaction">
   <description>
     Show a popup message to the player and block (i.e., pause execution) until the "ok" button is pressed and
     some text is entered.
   </description>
   <param name="message" type="any">The message</param>
   <return type="String">The text entered</return>
   <see><api>confirm</api>, <api>alert</api></see>
   </function>
 */


// Used by include to prevent multiple inclusions of the same file
var _ch_alreadyIncludedList = [];
/**
   <function name="include" category="core">
      <description>
        <p>Import definitions from another JavaScript file that is in 
        the same directory or at an explicit URL.  Files will only be evaluated
        once even if they are imported from multiple other files.</p>
        <p>
        The URL restrictions are intended to avoid bugs in your code; it is possible
        to manually include files from other directories by writing custom
        JavaScript.
        </p>
        <p>
        The include function should only be called at the top level from the
        beginning of a file.
        </p>
      </description>
      <param name="url" type="String">The url of the other JavaScript file, relative to your play.html file (not the current script). This must either start with 'http://', 'https://', or contain no slashes.  It must end in .js</param>
   </function>
 */
function include(url) {
    _ch_checkExactArgs(arguments, 1, "include(url)");

    if ((url.indexOf('>') !== -1) || (url.indexOf('<') !== -1)) {
        // This has script tags in it and might be some kind of attack
        _ch_error('"' + url + '" is not a legal URL for include()');
    }

    if ((url.length < 3) || (url.substring(url.length - 3, url.length) !== '.js')) {
        _ch_error('The url for include("' + url + '") must end in ".js"');
    }

    if ((url.indexOf('/') !== -1) &&
        ((url.length < 8) || 
         ((url.substring(0, 7) !== 'http://') &&
          (url.substring(0, 8) !== 'https://')))) {
        _ch_error('The url for include("' + url + '") must contain no slashes or begin with http:// or https://');
    }

    if (_ch_mode !== _ch_INIT) {
        _ch_error("Can only call include() at the top level before the game begins.");
    }

    if (_ch_alreadyIncludedList.indexOf(url) === -1) {
        _ch_alreadyIncludedList.push(url);
        document.write("<script src='" + url + "'></script>");
    }
}

/**
   <function name="setTouchKeyRectangle" category="interaction">
     <description>
        Defines a rectangular area of the screen to generate keyboard events
        when it is touched.  Each keyCode may be mapped to at most one shape
        at a time.  Setting it to a new rectangle overrides the previous definition.

        Touch keys block touch events from passing through them to <api>onTouchStart</api>, etc.
     </description>
     <param name="keyCode" type="Number">Code for the key (e.g., <code>asciiCode("W")</code>)</param>
     <param name="x"      type="Number"></param>
     <param name="y"      type="Number"></param>
     <param name="width"  type="Number"></param>
     <param name="height" type="Number"></param>
     <param name="label" type="image or string or null" optional="true">
       If an image is provided, then the image will be drawn on screen at the largest size that
       maintains the aspect ratio and fills the width and height. This means
       that if the aspect doesn't match, then the image will be larger than
       the touch region.
       <p>
       If a string is provided, then it will be rendered in the center of the rectangle
       and its outline will be drawn.
       </p>
       <p>
       If null, no key will be drawn.
       </p>
     </param>
     <see><api>removeTouchKey</api>, <api>setTouchKeyCircle</api>, <api>drawTouchKeys</api></see>
   </function>
 */
function setTouchKeyRectangle(keyCode, x, y, width, height, label) {
    _ch_checkArgs(arguments, 5,
                  "setTouchKeyRectangle(keyCode, x, y, width, height, <label>)");
    _ch_touchKeySet.set(keyCode, x, y, width, height, 0, label);
}


/**
   <function name="setTouchKeyCircle" category="interaction">
     <description>
        Defines a disk-shaped area of the screen to generate keyboard events
        when it is touched.  Each keyCode may be mapped to at most one shape
        at a time.  Setting it to a new circle overrides the previous definition.

        Touch keys block touch events from passing through them to <api>onTouchStart</api>, etc.
     </description>
     <param name="keyCode" type="Number">Code for the key (e.g., <code>asciiCode("W")</code>)</param>
     <param name="x"      type="Number"></param>
     <param name="y"      type="Number"></param>
     <param name="radius"  type="Number"></param>
     <param name="label" type="image or string or null" optional="true">
       If an image is provided, then the image will be drawn on screen at the largest size that
       covers the circle. This means that the image will be larger than the circle.
       the touch region.
       <p>
       If a string is provided, then it will be rendered in the center of the circle
       and the outline of the circle will be drawn.
       </p>
       <p>
       If null, no key will be drawn.
       </p>
     </param>
     <see><api>removeTouchKey</api>, <api>setTouchKeyRectangle</api>, <api>drawTouchKeys</api></see>
   </function>
 */
function setTouchKeyCircle(keyCode, x, y, radius, label) {
    _ch_checkArgs(arguments, 4,
                  "setTouchKeyRectangle(keyCode, x, y, radius, <label>)");
    _ch_touchKeySet.set(keyCode, x, y, 0, 0, radius, label);
}


/**
   <function name="removeTouchKey" category="interaction">
     <description>Removes a key previously defined by <api>setTouchKeyRectangle</api> or <api>setTouchKeyCircle</api>.</description>
     <param name="keyCode" type="Number"></param>
     <see><api>setTouchKeyCircle</api>, <api>setTouchKeyRectangle</api></see>
     <return type="Boolean">True if the touchkey was originally present</return>
   </function>
*/
function removeTouchKey(keyCode) {
    _ch_checkExactArgs(arguments, 1, "removeTouchKey(keyCode)");
    _ch_touchKeySet.remove(keyCode);
}

/** 
    <function name="defineFont" category="graphics">
      <description>
        <p>
        Define a font from a URL, so that it will be available even
        if not installed on the user's web browser.
        Must be called at the top level, not inside of a function.
        </p>
        <listing>
          defineFont("advocut", "advocut-webfont");
          
          function onTick() {
              clearRectangle(0, 0, screenWidth, screenHeight);
              fillText("Hello!", 100, 100, makeColor(1, 1, 0), "50px advocut");
          }
        </listing>

        <p>
        See <a href="http://www.google.com/fonts/">http://www.google.com/fonts/</a> for 
        a tremendous number of free web fonts that can be downloaded to distribute with
        your codeheart.js app or used directly from Google.
        </p>
      </description>
      <param name="name" type="String">The name that you would like to assign the font. Use this in the style string for <api>fillText</api> and <api>strokeText</api>.</param>
      <param name="url" type="url">The URL of the font, without the extension.  ".ttf" and ".woff" will be appended.
      If you have a font that you may legally embed but do not have it in both of these formats, you can 
      use <a href="http://www.fontsquirrel.com/tools/webfont-generator">webfont generator</a> to covert it.</param>
      <see><api>strokeText</api>, <api>fillText</api>, <api>defineGame</api></see>
    </function>
 */
function defineFont(name, url) {
    _ch_checkExactArgs(arguments, 2, "defineFont(name, url)");

    if (_ch_mode !== _ch_INIT) {
        _ch_error("Can only call defineFont() at the top level before the game begins.");
    }

    if (_ch_definedFonts.indexOf(name) === -1) {
        // Define a new font for the browser
        document.write("<style>@font-face { font-family: '" + name + 
                       "'; src: url('" + url + ".woff') format('woff'), url('" + url + ".ttf') format('truetype'); }</style>");
        // Force the font to load by using it on an (invisible) element
        document.write("<div style=\"font-family: \'" + name + "\'; position: absolute; left: -100px; top: -100px\">.</div>");
        _ch_definedFonts.push(name);
    }
}

/** All fonts, used to avoid loading them twice if included in modules. */
var _ch_definedFonts = [];

/**
   <function name="defineGame" category="core">

     <description> 
      Call from top level (outside of any function!) to
      define your game properties and create a title canvas.
      The title canvas forces the player to click on the window,
      which gives it keyboard focus in a desktop browser and
      triggers loading of audio resources on a mobile device.
     </description>

     <param name="gameName" type="String">
       Name of the game. Used for the browser title bar and
       on the title screen if no titleScreenURL is present.
     </param>

     <param name="authorName" type="String">
       Name of the author(s) and team. Used on the title screen 
       if no titleScreenURL is present.
     </param>
     
     <param name="titleScreenURL" optional="true" type="String">
        URL of an image to use as the title canvas background.
        Default is the empty string, which causes a title canvas
        to be generated from the gameName and authorName.
     </param>

     <param name="orientation" optional="true" type="String">
       Horizontal/landscape ("H") or vertical/portrait ("V"). Default is "H".
     </param>

     <param name="showTitleScreen" optional="true" type="Boolean">
       If true, show a title screen before invoking <api>onSetup</api>.
       Default is true.
     </param>

     <param name="pauseWhenUnfocused" optional="true" type="Boolean">
       If true, stop calling <api>onTick</api> when the browser tab
       containing the game does not have focus.  
       Default is true.
     </param>

     <param name="maxResolution" optional="true" type="Number or String">
       <p>
         This is the number of pixels in the resolution of the image for
         the shorter dimension which may be lower than the virtual device
         resolution that codeheart.js presents to the programmer.
       </p>
       <p>
         codeheart.js always presents the screen to the program as if it were
         1920x1280 (or transposed, in vertical orientation), however it is
         able to adjust the underlying resolution of the canvas to speed rendering
         on slow machines.  This number is the number of browser pixels to use for
         the longer screen dimension for the canvas.  If maxResolution is the string "auto",
         then the actual dimension of the device is used.  Setting a low resolution
         such as 480 can significantly increase graphics performance on some
         browsers and devices at the expense of image quality.
       </p>
       <p>
         The default is 1280 on desktop and "auto" on mobile devices.
         The true resolution will never exceed 1920x1280 because that
         degrades performance (even on iPad 3).
       </p>
     </param>

   <return type="undefined">none</return>
 </function>
 */
function defineGame(gameName, authorName, titleScreenURL, orientation, 
                    showTitleScreen, pauseWhenUnfocused, maxResolution) {
    _ch_checkArgs(arguments, 2, 
                  "defineGame(gameName, authorName, <titleScreenURL>, <orientation>, <showTitleScreen>, <pauseWhenUnfocused>, <maxResolution>)");

    if (_ch_mode !== _ch_INIT) {
        _ch_error("Can only call defineGame() at the top level before the game begins.");
    }

    _ch_showTitleScreen = (showTitleScreen === undefined) || showTitleScreen;
    _ch_pauseWhenUnfocused = (pauseWhenUnfocused === undefined) || pauseWhenUnfocused;

    // Default arguments
    titleScreenURL  = (titleScreenURL  === undefined) ? ""    : titleScreenURL;
    orientation     = (orientation     === undefined) ? "H"   : orientation;
    _ch_maxResolution = (maxResolution === undefined) ? (isMobile ? "auto" : 1280) : maxResolution;

    if (orientation !== 'H' && orientation !== 'V') {
        _ch_error("orientation must be either \"H\" or \"V\"");
    }

    if (isBoolean(_ch_maxResolution) || (_ch_maxResolution <= 0)) {
        _ch_error("maxResolution must be either \"auto\" or a positive number");
    }
    
    document.title = gameName;
    window.parent.document.title = gameName;

    if (titleScreenURL !== "") {
        _ch_titleScreenImage = loadImage(titleScreenURL);
    }
    _ch_gameName    = gameName;
    _ch_authorName  = authorName;
    _ch_orientation = orientation;

    _ch_setOrientation();
}


/**
   <function name="currentTime" category="interaction">
     <description>
       Current time, with sub-millisecond accuracy on most platforms. 
       This is primarily useful for timing animation.
     </description>
     <return type="Number">The time in seconds since 
       January 1, 1970, 00:00:00, local time (i.e., "Unix time").  
     </return>
   </function>
 */
var currentTime = 
    (window.performance && window.performance.now) ? 
    function () {
        return (window.performance.now() + window.performance.timing.navigationStart) * 0.001;
    } :
    function () {
        return Date.now() * 0.001;
    };


/**
   <function name="reset" category="core">
      <description>
        Ends the game and returns to the title canvas,
        which will cause your <api>onSetup</api> to be called again.
      </description>
      <return type="undefined">none</return>
   </function>
*/
function reset() {
    _ch_checkExactArgs(arguments, 0, "reset()");

    if (_ch_mode !== _ch_PLAY && _ch_mode !== _ch_SETUP) {
        _ch_error("Can only call returnToTitleScreen() after the game has started");
    }

    _ch_mode = _ch_SETUP;
}


/**
   <function name="asciiCode" category="datastructure">
     <description>
       Returns the number that is the ASCII code for this one-character string.
       This is useful for generating the key codes for capital letters to use 
       with <api>onKeyStart</api> and other key events.
     </description>
     <param name="s" type="String"></param>
     <see><api>asciiCharacter</api></see>
   </function>
 */
function asciiCode(s) {
    _ch_checkExactArgs(arguments, 1, "asciiCode(s)");
    if (s.length !== 1) {
        _ch_error("asciiCode requires a string of exactly one character");
    }
    return s.charCodeAt(0);
}


/**
   <function name="asciiCharacter" category="datastructure">
     <description>
       Returns a string from an ASCII code.
     </description>
     <param name="n" type="Number"></param>
     <see><api>asciiCode</api></see>
   </function>
 */
function asciiCharacter(n) {
    _ch_checkExactArgs(arguments, 1, "asciiCharacter(n)");
    if ((typeof n !== 'number') || (n !== Math.floor(n)) ||
        (n < 0) || (n > 255)) {
        _ch_error("asciiCharacter requires an integer between 0 and 255");
    }
    return String.fromCharCode(n);
}


/**
  <function name="randomReal" category="math">
  
    <description>
      Generates a random real number on [low, high).
    </description>

    <param name="low" type="Number">
      The lowest possible number generated by randomreal.
    </param>

    <param name="high" type="Number">
      This is higher than the highest number the function will generate.
      For example, if high=7, you might get numbers such as 6.999999, but
      not 7.
    </param>

    <param name="rng" type="function" optional="true">
      The random number generating function. Math.random is used by default.
    </param>

    <return type="Number"> A pseudo-random real number on [low, high] </return>
    <see><api>randomInteger</api></see>
  </function>
*/
function randomReal(low, high, rng) {
    _ch_checkArgs(arguments, 2, "randomReal(low, high, <rng>)");

    // Catch some common errors
    if (isNaN(low) || isNaN(high) || (low > high) || ! isNumber(low) || ! isNumber(high) || (low === -Infinity) || (high === +Infinity)) {
        _ch_error("low must be no greater than high and both must be finite numbers");
    }

    var r = rng ? rng() : Math.random();
    return r * (high - low) + low;
}


/**
  <function name="randomInteger" category="math">

    <description>
      Generates a random integer on [low, high].
    </description>

    <param name="low" type="Number">
      The lowest number the function call will return.
    </param>

    <param name="high" type="Number">
      The highest number the function call will return.
    </param>

    <param name="rng" type="function" optional="true">
      The random number generating function. Math.random is used by default.
    </param>

    <return type="Number"> A random integer on [low, high]</return>
    <see>randomReal</see>
  </function>
*/
function randomInteger(low, high, rng) {
    _ch_checkArgs(arguments, 2, "randomInteger(low, high, <rng>)");

    return Math.min(high, floor(randomReal(low, high + 1, rng)));
}


/** 
  <function name="floor" category="math">

    <description>
      Returns the largest integer smaller than or equal to <arg>x</arg>.
    </description>

    <param name="x" type="any">If <arg>x</arg> is an object or array, then
    the floor operation applies across all elements.
    </param>

    <return type="Number">The largest integer smaller than or equal to <arg>x</arg>.</return> 
  </function>
*/
function floor(v) {
    return _ch_vecApply('floor', Math.floor, v);
}

/**
  <function name="ceil" category="math">

    <description>
      Return the smallest integer greater than or equal to <arg>x</arg>.
    </description>

    <param name="x" type="any">If <arg>x</arg> is an object or array, then
    the ceil operation applies across all elements.
    </param>

    <return type="Number">The smallest integer greater than or equal to x.</return>
  </function> 
*/
function ceil(v) {
    return _ch_vecApply('ceil', Math.ceil, v);
}

/** 
  <function name="abs" category="math">
    
    <description>
      Returns the absolute value of x.
      (Math.abs is slightly faster but less general)
    </description>
  
    <param name="x" type="any"></param>

    <return type="any">Returns the absolute value of x.</return>
  </function>
*/
var abs = function(x) {
    return _ch_vecApply('abs', Math.abs, x);
}

/** 
  <function name="cos" category="math">
    
    <description>
      Returns the cosine of <arg>x</arg> [radians].
    </description>
  
    <param name="x" type="Number"></param>

    <return type="Number">Returns the cosine of x.</return>
  </function>
*/
var cos = Math.cos;

/** 
  <function name="sin" category="math">
    
    <description>
      Returns the sine of <arg>x</arg> [radians].
    </description>
  
    <param name="x" type="Number"></param>

    <return type="Number">Returns the sine of x.</return>
  </function>
*/
var sin = Math.sin;


/** 
  <function name="sign" category="math">
  
  <description>
     For vectors and
     arrays, this is applied to all fields. 
     (Math.sign is slightly faster but less general)
   </description>
    <param name="x" type="any"></param>

    <return type="any">
     if <arg>x</arg>==0, +1 if <arg>x</arg> &gt; 0,
     and -1 if <arg>x</arg> &lt; 0.
     </return>
  </function>
*/
var sign = function(x) {
    return _ch_vecApply('sign', Math.sign, x);
}

/** 
  <function name="tan" category="math">
    
    <description>
      Returns the tangent of x [radians].
    </description>
  
    <param name="x" type="Number"></param>

    <return type="Number">Returns the tangent of x.</return>
  </function>
*/
var tan = Math.tan;

/** 
  <function name="atan2" category="math">
    
    <description>
      Returns the arctangent (in radians) of y/x.
    </description>
  
    <param name="y" type="Number"></param>
    <param name="x" type="Number"></param>

    <return type="Number">Returns the arctangent of y/x (in radians).</return>
    <see><api>atan</api>, <api>tan</api></see>
  </function>
*/
var atan2 = Math.atan2;

/** 
  <function name="atan" category="math">
    
    <description>
      Returns the arctangent of x.
    </description>
  
    <param name="x" type="Number"></param>

    <return type="Number">Returns the arctangent of y/x (in radians).</return>
    <see><api>atan2</api>, <api>tan</api></see>
  </function>
*/
var atan = Math.atan;

/** 
  <function name="log" category="math">
    
    <description>
      Returns the natural log (log<sub>e</sub>) of x.
    </description>
  
    <param name="x" type="Number"></param>

    <return type="Number">Returns the natural log (log base e) of x.</return>
    <see><api>log2</api>, <api>exp</api>, <api>pow</api></see>
  </function>
*/
var log = Math.log;

/**
 <function name="log2" category="math">
    
    <description>
      Returns the base-2 log (log<sub>e</sub>) of x.
    </description>
  
    <param name="x" type="Number"></param>

    <return type="Number">Returns the natural log (log base e) of x.</return>
    <see><api>log</api>, <api>exp</api>, <api>pow</api></see>
 </function>
*/
function log2(x) {
    _ch_checkArgs(arguments, 1, "log2(x)");
    return Math.log(x) / Math.log(2);
}


/** 
  <function name="round" category="math">
    
    <description>
      Returns <arg>x</arg>, rounded.
    </description>
  
    <param name="x" type="Number"></param>

    <return type="Number"> Returns <arg>x</arg>, rounded.</return>
    <see><api>floor</api>, <api>ceil</api></see>
  </function>
*/
var round = Math.round;


/** 
  <function name="sqrt" category="math">
    
    <description>
      Returns the square root of <arg>x</arg>.
      (Math.sqrt is slightly faster but less general)
    </description>
  
    <param name="x" type="any"></param>

    <return type="any"> Returns the square root of <arg>x</arg>.</return>
    <see><api>pow</api></see>
  </function>
*/
var sqrt = function(x) {
    return _ch_vecApply('sqrt', Math.sqrt, x);
}



/** 
  <function name="pow" category="math">
    
    <description>
      Returns <arg>x</arg> raised to the power of <arg>y</arg>.
    </description>
  
    <param name="x" type="Number"></param>
    <param name="y" type="Number"></param>

    <return type="Number"> Returns <arg>x</arg> to the power of <arg>y</arg>.</return>

    <see><api>log</api>, <api>exp</api>, <api>log2</api>, <api>sqrt</api></see>
  </function>
*/
var pow = Math.pow;


/** 
  <function name="max" category="math">
    
    <description>
      Returns the largest of all the numbers passed to the function.
      When applied to objects or arrays, operates componentwise.
    </description>

    <param name="..." type="any">Any number of arguments</param>

    <return type="any"> Returns the largest of all the numbers passed to the function.</return>

    <see><api>min</api></see>
  </function>
*/
function max(a, b) {
    switch (arguments.length) {
    case 1:
        return a;

    case 2:
        return _ch_vecApply('max', Math.max, a, b);

    default:
        for (var i = 1; i < arguments.length; ++i) {
            a = _ch_vecApply('max', Math.max, a, arguments[i]);
        }
        return a;
    }
}


/** 
  <function name="min" category="math">
    <description>
      Returns the smallest of all the numbers passed to the function.
      When applied to objects or arrays, operates componentwise.

      <listing>
         x = min(1, y, z);
         a = min(b, c);
         v = min(vec2(1, 5), vec2(4, 2)); // == vec2(1, 2)
         q = min(vec2(2, 5), 3); // == vec2(2, 3))
      </listing>
    </description>

    <param name="..." type="any">Any number of arguments</param>
    <return type="any"> Returns the smallest of all the numbers passed to the function.</return>
    <see><api>max</api></see>
  </function>
*/
function min(a, b) {
    switch (arguments.length) {
    case 1:
        return a;

    case 2:
        return _ch_vecApply('max', Math.min, a, b);

    default:
        for (var i = 1; i < arguments.length; ++i) {
            a = _ch_vecApply('max', Math.min, a, arguments[i]);
        }
        return a;
    }
}



/**
  <function name="exp" category="math">
    <param name="x" type="Number"></param>
    <return type="Number">Returns e<sup>x</sup></return>
    <see><api>pow</api>, <api>log</api>, <api>log2</api></see>
  </function>
*/
var exp = Math.exp;


/**
  <function name="length" category="datastructure">

    <description>
      Returns the number of elements in array or characters in a string.
    </description>
    <param name="x" type="array or string"></param>
    <return type="Number">The number of elements in array or characters in a string.</return>

    <see><api>magnitude</api></see>
  </function>
*/
function length(x) {
    _ch_checkArgs(arguments, 1, "length(x)");
    return x.length;
}


/**
 <function name="cloneArray" category="datastructure">
   <description>
     Shallow copy of the source array
   </description>
   <param name="x" type="Array"></param>
   <return type="Array">A new array containing the same elements as <arg>x</arg>.</return>
   <see><api>makeArray</api>, <api>resizeArray</api></see>
 </function> 
*/
function cloneArray(x) {
    _ch_checkArgs(arguments, 1, "cloneArray(x)");
    return x.slice(0);
}


/** 
    <function name="forEach" category="datastructure">
      <description>
       <p>
        Invokes <arg>fcn</arg>(<arg>array</arg>[i], i, <arg>array</arg>) for each element of the 
        <arg>array</arg>. Note that <arg>fcn</arg> may simply ignore any of those arguments that it
        does not require, e.g.,
        <listing>
         forEach([1, 2, 3, 4], function(v) { console.log(v); });
         </listing>
       </p>
       <p>
       <arg>fcn</arg> may return one of the following three special values.
       Other return values are ignored:

         <ul>
           <li>forEach.BREAK  - End iteration immediately</li>
           <li>forEach.REMOVE - Remove the current element, preserving array ordering</li>
           <li>forEach.FAST_REMOVE - Remove the current element in amortized O(1) time but without preserving array ordering</li>
         </ul>

         Iteration order is guaranteed to be from element 0 to the end, and all elements
         are guaranteed to be visited up to a BREAK call.
         </p>
       <p>
         Javascript 1.6 also provides methods forEach, map, some, and every on the Array
         class that provide similar but not identical functionality.
        </p>
     </description>
     <param name="array" type="Array">The array to iterate over</param>
     <param name="fcn" type="function">The function to invoke for each element of the array</param>
   </function>
*/
function forEach(array, fcn) {
    _ch_checkArgs(arguments, 2, "forEach(array, fcn)");
    if (! isArray(array) || ! isFunction(fcn)) { _ch_error("forEach takes an array and a function as arguments"); }
    
    for (var i = 0; i < array.length; ++i) {
        switch (fcn(array[i], i, array)) {
        case forEach.BREAK:
            return;

        case forEach.REMOVE:
            if (array.length > 0) {
                removeAt(array, i);
                --i;
            }
            break;

        case forEach.FAST_REMOVE:
            if (i != array.length - 1) {
                // Move the last to here, and then process this element again
                array[i] = array.pop();
                --i;
            } else if (array.length > 0) {
                // Remove the last one and then exit
                array.pop();
            }
            break;
        }
    }
}
// Make each element a unique object that could not be accidentally returned by another function
forEach.BREAK  = Object.freeze(["BREAK"]);
forEach.REMOVE = Object.freeze(["REMOVE"]);
forEach.FAST_REMOVE = Object.freeze(["FAST_REMOVE"]);
Object.freeze(forEach);

/**
   <function name="insertFront" category="datastructure">
     <description>
       Places a value at the beginning of an array.
       If multiple values are passed, inserts all of them at the front 
       of the array in the order that they appear in the argument list.
      </description>
      <param name="array" type="Array"></param> 
      <param name="value" type="any"></param> 
      <param name="..." type="any"></param> 
      <see><api>insertBack</api>, <api>removeFront</api>, <api>removeBack</api></see>
   </function>
 */
function insertFront(array, value) {
    _ch_checkArgs(arguments, 2, "insertFront(array, value, ...)");
    for (var i = arguments.length - 1; i > 0; --i) {
        array.unshift(arguments[i]);
    }
}


/**
   <function name="insertBack" category="datastructure">
     <description>
       Places a value at the end of an array.
       If multiple arguments are passed, places all of them at the end
       in the order that they are passed.
      </description>
      <param name="array" type="Array"></param> 
      <param name="value" type="any"></param> 
      <param name="..." type="any"></param> 
      <see><api>insertFront</api>, <api>removeFront</api>, <api>removeBack</api>, <api>insertAt</api>, <api>removeAt</api></see>
   </function>
 */
function insertBack(array, value) {
    _ch_checkArgs(arguments, 2, "insertBack(array, value, ...)");
    for (var i = 1; i < arguments.length; ++i) {
        array.push(arguments[i]);
    }
}


/**
   <function name="insertAt" category="datastructure">
     <description>
       Places a value at location <arg>index</arg> in <arg>array</arg>. Existing elements
       are shifted towards the back of the array.
       If multiple arguments are passed, places all of them starting at <arg>index</arg>
       in the order that they are passed.


       <listing>
         var x = [0, 1, 2];
         insertAt(x, 1, "NEW");
         // Result: x == [0, "NEW", 1, 2]
       </listing>
      </description>
      <param name="array" type="Array"></param> 
      <param name="index" type="Number"></param> 
      <param name="value" type="any"></param> 
      <param name="..." type="any"></param> 
      <see><api>insertFront</api>, <api>removeFront</api>, <api>removeBack</api>, <api>removeAt</api>, <api>insertBack</api></see>
   </function>
 */
function insertAt(array, index, value) {
    _ch_checkArgs(arguments, 3, "insertAt(array, index, value, ...)");
    if (typeof index !== 'number') {
        _ch_error("The index to insertAt must be a number");
    }

    if (arguments.length === 3) {
        // Just one
        array.splice(index, 0, value);
    } else {
        var args = [index, 0].concat(Array.prototype.slice.call(arguments, 2));
        Array.prototype.splice.apply(array, args);
    }
}


/**
   <function name="removeAt" category="datastructure">
     <description>
       Removes a value from location <arg>index</arg> in <arg>array</arg> and returns it. Subsequent elements are shifted back towards the front of the array.
      </description>
      <param name="array" type="Array"></param> 
      <param name="index" type="Number"></param> 
      <return type="any">The value that was removed</return>
      <see><api>insertFront</api>, <api>removeFront</api>, <api>removeBack</api>, <api>insertAt</api>, <api>insertBack</api></see>
   </function>
 */
function removeAt(array, index) {
    _ch_checkExactArgs(arguments, 2, "removeAt(array, index)");
    if (typeof index !== 'number') {
        _ch_error("The index to removeAt must be a number");
    }

    var temp = array[index];
    array.splice(index, 1);
    return temp;
}


/**
   <function name="removeBack" category="datastructure">
     <description>
       Removes a value from the end of an array.
      </description>
      <param name="array" type="Array"></param> 
      <see><api>insertFront</api>, <api>removeFront</api>, <api>insertBack</api></see>
      <return type="any">The value that was removed</return>
   </function>
 */
function removeBack(array) {
    _ch_checkExactArgs(arguments, 1, "removeBack(array)");
    return array.pop();
}

/**
   <function name="removeFront" category="datastructure">
     <description>
       Removes a value from the front of an array.
      </description>
      <param name="array" type="Array"></param> 

      <see><api>insertFront</api>, <api>removeBack</api>, <api>insertBack</api></see>
      <return type="any">The value that was removed</return>
   </function>
 */
function removeFront(array) {
    _ch_checkExactArgs(arguments, 1, "removeFront(array)");
    return array.shift();
}


/**
   <function name="substring" category="datastructure">
   
     <description>
       Returns a continuous portion of the given string.
       ex. One substring of "Hello" is "Hel".
     </description>

     <param name="s" type="String">
       The string of which you are taking a substring.
     </param>

     <param name="begin" type="Number">
       The index of the first letter included in the substring.
       Strings are 0-indexed, so in "Hello", 'H' is character 0.
     </param>

     <param name="end" type="Number">
       The index of the first character to be excluded from the 
       string.
     </param>

     <return type="String"> Returns a substring of the given string. </return>

     <see><api>indexOf</api></see>
   </function>
*/
function substring(s, begin, end) {
    _ch_checkExactArgs(arguments, 3, "substring(str, begin, end)");
    return s.substring(begin, end);
}


/** 
  <function name="indexOf" category="datastructure">
  
    <description>
      Returns the index of the first occurence of a given value
      <arg>searchFor</arg> in the substring or subarray 
      of <arg>s</arg> starting at the index <arg>begin</arg>.
      If searchFor does not occur in the substring or subarray of <arg>s</arg>, returns -1.
    </description>

    <param name="s" type="String or Array"> 
      The value that you wish to search within.
    </param>

    <param name="searchFor" type="any">
      The value for which you are searching.
    </param>

    <param name="begin" optional="true" type="Number">
      The index of the beginning of the substring/subarray of <arg>s</arg> you wish to search.
    </param>

    <return type="Number"> The index of the first occurence of <arg>searchFor</arg>.</return>

    <see><api>substring</api>, <api>removeAt</api></see>
  </function>
*/
function indexOf(s, searchFor, begin) {
    _ch_checkArgs(arguments, 2, "indexOf(strOrArray, searchFor, <$1>)");
    begin = (begin === undefined) ? 0 : begin;

    // Conveniently, this will work correctly on both arrays and strings
    return s.indexOf(searchFor, begin);
}


/** 
  <function name="toUpperCase" category="datastructure">
    <param name="x" type="String"></param>
  </function>  
*/
function toUpperCase(x) {
    _ch_checkExactArgs(arguments, 1, "toUpperCase(str)");
    return x.toUpperCase();
}


/**
   <function name="toLowerCase" category="datastructure">
    <param name="x" type="String"></param>
   </function>  
*/
function toLowerCase(x) {
    _ch_checkExactArgs(arguments, 1, "toLowerCase(str)");
    return x.toLowerCase();
}


/*
This function is deprecated but retained for backwards compatibility
 <function name="clearScreen" category="graphics">
      <description>
        <p>
          Clears the canvas to transparent.
        </p>
        <p>
          Since the default play.html has a black background, this makes the canvas appear black.
          If you change the background to another color or pattern, it will show through
          cleared areas.
        </p>
      </description>
    </function>
*/
function clearScreen() {
    _ch_checkExactArgs(arguments, 0, "clearScreen()");

    // Store the current transformation matrix
    _ch_ctx.save();
    
    // Use the identity matrix while clearing the canvas
    _ch_ctx.setTransform(1, 0, 0, 1, 0, 0);
    clearRectangle(0, 0, screenWidth, screenHeight);
    
    // Restore the transform
    _ch_ctx.restore();
}


/**
    <function name="clearRectangle" category="graphics">
    <description>
        <p>
          Clears the specified rectangle to transparent.
        </p>
        <p>
          Since the default play.html has a black background, this makes the canvas appear black.
          If you change the background to another color or pattern, it will show through
          cleared areas.
        </p>
    </description>
    <param name="x0" type="Number">Upper-left corner</param>
    <param name="y0" type="Number">Upper-left corner</param>
    <param name="w" type="Number">Width</param>
    <param name="h" type="Number">Height</param>
    </function>
*/
function clearRectangle(x0, y0, w, h) {
    _ch_checkArgs(arguments, 4, "clearRectangle(x0, y0, w, h)");
    _ch_ctx.clearRect(x0, y0, w, h);
}


/** 
    <function name="fillCircle" category="graphics">
      <description>
            Draw a solid circle.
      </description>
      <param name="x" type="Number">Distance from the left edge of the canvas to the center of the circle.</param> 
      <param name="y" type="Number">Distance from the top edge of the canvas to the center of the circle.</param> 
      <param name="radius" type="Number"></param>
      <param name="color" type="color"></param>
    </function>
*/
function fillCircle(x, y, radius, color) {
    _ch_checkArgs(arguments, 4, "fillCircle(x, y, radius, color)");

    _ch_ctx.fillStyle = color;

    _ch_ctx.beginPath();
    _ch_ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
    _ch_ctx.fill();
}


/**
    <function name="strokeCircle" category="graphics">
      <description>
            Draw a circle outline.
      </description>
      <param name="x" type="Number">Distance from the left edge of the canvas to the center of the circle.</param> 
      <param name="y" type="Number">Distance from the top edge of the canvas to the center of the circle.</param> 
      <param name="radius" type="Number"></param>
      <param name="color" type="color"></param>
      <param name="thickness" type="Number"></param>
    </function>
*/
function strokeCircle(x, y, radius, color, thickness) {
    _ch_checkArgs(arguments, 5, "strokeCircle(x, y, radius, color, thickness)");

    _ch_ctx.lineWidth   = thickness;
    _ch_ctx.strokeStyle = color;

    _ch_ctx.beginPath();
    _ch_ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
    _ch_ctx.stroke();
}


/** 
    <function name="fillTriangle" level="advanced" category="graphics">
    <description>
       Draws a solid triangle. This function does not check its arguments, for performance.
    </description>
    <param name="x0" type="Number"></param>
    <param name="y0" type="Number"></param>
    <param name="x1" type="Number"></param>
    <param name="y1" type="Number"></param>
    <param name="x2" type="Number"></param>
    <param name="y2" type="Number"></param>
    <param name="color" type="color"></param>
    <see><api>strokeTriangle</api>, <api>drawImageTriangle</api>, <api>drawGradientTriangle</api></see>
    </function>
*/
function fillTriangle(x0, y0, x1, y1, x2, y2, color) {
    _ch_ctx.beginPath();
    _ch_ctx.moveTo(x0, y0);
    _ch_ctx.lineTo(x1, y1);
    _ch_ctx.lineTo(x2, y2);
    _ch_ctx.closePath();
    _ch_ctx.fillStyle = color;
    _ch_ctx.fill();
}

/** 
    <function name="strokeTriangle" level="advanced" category="graphics">
    <description>
      Draws the outline of a triangle. This function does not check its arguments, for performance.
    </description>
    <param name="x0" type="Number"></param>
    <param name="y0" type="Number"></param>
    <param name="x1" type="Number"></param>
    <param name="y1" type="Number"></param>
    <param name="x2" type="Number"></param>
    <param name="y2" type="Number"></param>
    <param name="color" type="color"></param>
    <param name="thickness" type="Number"></param>
    <see><api>fillTriangle</api>, <api>drawImageTriangle</api>, <api>drawGradientTriangle</api></see>
    </function>
*/
function strokeTriangle(x0, y0, x1, y1, x2, y2, color, thickness) {
    _ch_ctx.beginPath();
    _ch_ctx.moveTo(x0, y0);
    _ch_ctx.lineTo(x1, y1);
    _ch_ctx.lineTo(x2, y2);
    _ch_ctx.closePath();
    _ch_ctx.lineWidth = thickness;
    _ch_ctx.strokeStyle = color;
    _ch_ctx.stroke();
}


/** 
    <function name="fillRectangle" category="graphics">
    <description>
       Draws a solid rectangle.
    </description>
    <param name="x0" type="Number"></param>
    <param name="y0" type="Number"></param>
    <param name="w" type="Number"></param>
    <param name="h" type="Number"></param>
    <param name="color" type="color"></param>
    <param name="cornerRadius" type="Number" optional="true">Round corners to this radius if specified</param>
    </function>
*/
function fillRectangle(x0, y0, w, h, color, radius) {
    _ch_checkArgs(arguments, 5, "fillRectangle(x0, y0, w, h, color, <radius>)");

    _ch_ctx.fillStyle = color;

    if ((radius === undefined) || (radius <= 0)) {
        _ch_ctx.fillRect(x0, y0, w, h);
    } else {
        _ch_roundRectPath(_ch_ctx, x0, y0, w, h, radius);
        _ch_ctx.fill();
    }
}


/**
   <function name="fillPolygon" category="graphics">
     <description>
        Draws a polygon.
     </description>
     <param name="C" type="Array">Array of control points in the form <code> [x0, y0,  x1, y1,  ... ]</code></param>
     <param name="color" type="color">Color created by <api>makeColor</api></param>
     <see><api>strokePolygon</api>, <api>fillRectangle</api>, <api>fillTriangle</api>, <api>drawImageTriangle</api>, <api>fillSpline</api></see>
   </function>
*/
function fillPolygon(pts, color) {
    _ch_checkArgs(arguments, 2, "fillPolygon(pts, color)");
    if (pts.length < 2) {
        return;
    }

    _ch_ctx.fillStyle = color;
    _ch_ctx.beginPath();

    _ch_ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) {
        _ch_ctx.lineTo(pts[i], pts[i + 1]);
    }

    _ch_ctx.closePath();
    _ch_ctx.fill();
}


/**
   <function name="strokePolygon" category="graphics">
     <description>
        Draws a polygon outline, or a polyline
     </description>
     <param name="C" type="Array">Array of control points in the form <code> [x0, y0,  x1, y1,  ... ]</code></param>
     <param name="color" type="color">Color created by <api>makeColor</api></param>
     <param name="thickness" type="Number"></param>
     <param name="close" type="Boolean" optional="true" default="true"></param>
     
     <see><api>fillPolygon</api>, <api>strokeSpline</api></see>
   </function>
*/
function strokePolygon(pts, color, thickness, close) {
    _ch_checkArgs(arguments, 3, "strokePolygon(pts, color, thickness, <close>)");
    if (pts.length < 2) {
        return;
    }
    
    _ch_ctx.lineWidth   = thickness;
    _ch_ctx.strokeStyle = color;
    _ch_ctx.beginPath();

    _ch_ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) {
        _ch_ctx.lineTo(pts[i], pts[i + 1]);
    }

    if (close) { _ch_ctx.closePath(); }
    _ch_ctx.stroke();
}


/**
from http://js-bits.blogspot.com/2010/07/canvas-rounded-corner-rectangles.html
Uses quadratic splines to work around bugs in arcto in old browsers
*/
function _ch_roundRectPath(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}


/** 
    <function name="strokeRectangle" category="graphics">
    <description>
       Draws a rectangle outline.
    </description>
    <param name="x0" type="Number"></param>
    <param name="y0" type="Number"></param>
    <param name="w" type="Number"></param>
    <param name="h" type="Number"></param>
    <param name="color" type="color"></param>
    <param name="thickness" type="Number"></param>
    <param name="cornerRadius" type="Number" optional="true">Round corners to this radius if specified</param>
    </function>
 */
function strokeRectangle(x0, y0, w, h, color, thickness, radius) {
    _ch_checkArgs(arguments, 6, "strokeRectangle(x0, y0, w, h, color, thickness, <radius>)");

    _ch_ctx.lineWidth = thickness;
    _ch_ctx.strokeStyle = color;

    if ((radius === undefined) || (radius <= 0)) {
        _ch_ctx.strokeRect(x0, y0, w, h);
    } else {
        _ch_roundRectPath(_ch_ctx, x0, y0, w, h, radius);
        _ch_ctx.stroke();
    }
}


/** <function name="fillText" category="graphics">
      <description> 
        <p>
         Draws text on the canvas.
        </p>
     </description>

     <param name="text" type="any"></param>
     <param name="x" type="Number"></param>
     <param name="y" type="Number"></param>
     <param name="color" type="color"></param>
     <param name="style" type="String">CSS font
      specification (e.g. <code>"bold 20px sans-serif"</code>) </param>
    <param name="xAlign" optional="true" type="String">'start', 'left', 'center', 'end', 'right'.  Default is 'start'. (see <a href="http://uupaa-js-spinoff.googlecode.com/svn/trunk/uupaa-excanvas.js/demo/8_3_canvas_textAlign.html">this page</a> for details)</param>
    <param name="yAlign" optional="true" type="String"> 'bottom', 'top', 'hanging', 'middle', 'ideographic',
     'alphabetic'.  Default is 'alphabetic' (see <a href="http://www.html5tutorial.info/html5-canvas-text.php">this page</a> for details)
    </param>
    
    <see><api>strokeText</api>, <api>measureTextWidth</api></see>
    </function>
*/
function fillText(text, x, y, color, style, xAlign, yAlign) {
    _ch_checkArgs(arguments, 5, "fillText(text, x, y, color, style, <xAlign>, <yAlign>)");

    xAlign = (xAlign === undefined) ? 'start' : xAlign;
    yAlign = (yAlign === undefined) ? 'alphabetic' : yAlign;

    if (typeof y !== 'number') {
        _ch_error("The y-position argument to fillText must be a number.");
    }

    _ch_ctx.textAlign    = xAlign;
    _ch_ctx.textBaseline = yAlign;
    _ch_ctx.font         = style;
    _ch_ctx.fillStyle    = color;

    try {
        // Mozilla throws an exception if the text goes off canvas.  This
        // seems to be related to a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=564332
        _ch_ctx.fillText(text, x, y);
    } catch (e) {}
}


/** <function name="measureTextWidth" category="graphics">
      <description>Returns the width of <arg>text</arg> if it was drawn with <api>fillText</api></description>
      <param name="text" type="any"></param>
      <param name="style" type="String"></param>
      <return type="Number">Pixel width of <arg>text</arg> when drawn.</return>
    </function>
*/
function measureTextWidth(text, style) {
    _ch_checkArgs(arguments, 2, "measureText(text, style)");

    _ch_ctx.font         = style;

    return _ch_ctx.measureText(text).width;
}


/**  <function name="strokeText" category="graphics">
      <description> 
        <p>
         Draws outlined text on the canvas.
         
         Due to a <a href="https://code.google.com/p/chromium/issues/detail?id=311731">bug in Chrome as of May 2014</a>, this gives incorrect results on that browser when the font style is greater than 256 pixels.
        </p>
     </description>

     <param name="text" type="any"></param>
     <param name="x" type="Number"></param>
     <param name="y" type="Number"></param>
     <param name="color" type="color">Created by <api>makeColor</api></param>
     <param name="style" type="String">CSS font
      specification (e.g. <code>"bold 20px sans-serif"</code>) </param>
      <param name="thickness" type="Number">Width of the lines in pixels</param>
    <param name="xAlign" optional="true" type="String">'start', 'left', 'center', 'end', 'right'.  Default is 'start'. (see <a href="http://uupaa-js-spinoff.googlecode.com/svn/trunk/uupaa-excanvas.js/demo/8_3_canvas_textAlign.html">this page</a> for details)</param>
    <param name="yAlign" optional="true" type="String"> 'bottom', 'top', 'hanging', 'middle', 'ideographic',
     'alphabetic'.  Default is 'alphabetic' (see <a href="http://www.html5tutorial.info/html5-canvas-text.php">this page</a> for details)
    </param>

    <see><api>fillText</api>, <api>measureTextWidth</api></see>
    </function>
*/
function strokeText(text, x, y, color, style, thickness, xAlign, yAlign) {
    _ch_checkArgs(arguments, 6, "strokeText(text, x, y, color, style, thickness, <xAlign>, <yAlign>)");

    xAlign = (xAlign === undefined) ? 'start' : xAlign;
    yAlign = (yAlign === undefined) ? 'alphabetic' : yAlign;

    _ch_ctx.lineWidth    = thickness;
    _ch_ctx.textAlign    = xAlign;
    _ch_ctx.textBaseline = yAlign;
    _ch_ctx.font         = style;
    _ch_ctx.strokeStyle  = color;
    _ch_ctx.strokeText(text, x, y);
}


/**
   <function name="strokeSpline" category="graphics">
     <description>
       Draws a Catmull-Rom piecewise-third order spline that 
       passes through all of the control points.
     </description>
     <param name="C" type="Array">Array of control points in the form <code> [x0, y0,  x1, y1,  ... ]</code></param>
     <param name="color" type="color">Color created by <api>makeColor</api></param>
     <param name="thickness" type="Number">Width of the curve in pixels</param>
     <param name="close" type="Boolean" optional="true">If specified and true, connect the last point back to the first point.  Otherwise the spline is open.</param>
     <see><api>fillSpline</api></see>
   </function>
*/
function strokeSpline(C, color, thickness, close){
    _ch_checkArgs(arguments, 3, "strokeSpline(controlPoints, color, thickness, <close>)");

    close = (close === undefined) ? false : close;

    _ch_ctx.lineWidth = thickness;
    _ch_ctx.strokeStyle = color;

    _ch_ctx.beginPath();
    _ch_splineTo(_ch_ctx, C, close);
    _ch_ctx.stroke();
}


/**
   <function name="fillSpline" category="graphics">
     <description>
       Draws a Catmull-Rom piecewise-third order spline that 
       passes through all of the control points and then
       fills the shape that it defines.
     </description>
     <param name="C" type="Array">Array of control points in the form <code> [x0, y0,  x1, y1,  ... ]</code></param>
     <param name="color" type="color">Color created by <api>makeColor</api></param>
     <param name="close" type="Boolean" optional="true">If specified and true, connect the last point back to the first point with a curve.  Otherwise connect them with a straight line</param>
     <see><api>strokeSpline</api></see>
   </function>
*/
function fillSpline(C, color, close) {
    _ch_checkArgs(arguments, 2, "fillSpline(controlPoints, color, <close>)");

    close = (close === undefined) ? false : close;

    _ch_ctx.fillStyle = color;

    _ch_ctx.beginPath();
    _ch_splineTo(_ch_ctx, C, close);
    _ch_ctx.closePath();

    _ch_ctx.fill();
}


/** 
    <function name="drawImage" category="graphics">
      <description>
<p>
      Draws the subset of <arg>image</arg> that is the rectangle
    with corner (<arg>srcX0</arg>, <arg>srcY0</arg>) and dimensions
    (<arg>srcWidth</arg>, <arg>srcHeight</arg>) to
    to the rectangle with upper-left corner (<arg>dstX0</arg>, <arg>dstY0</arg>)
    with dimensions (<arg>dstWidth</arg>, <arg>dstHeight</arg>).
</p>
<p>
    Undefined coordinates are set to (0, 0) and undefined
    dimensions are those of the image.
</p>
<p>
    Examples:
    <listing>
       drawImage(img, 100, 200);

       // Stretch to 32x32
       drawImage(img, 100, 200, 32, 32);

       // Copy the 64x64 image from (0, 40) to (100, 200) and shrink it to 32x32
       drawImage(img, 100, 200, 32, 32, 0, 40, 64, 64);  
    </listing>
</p>
    </description>

    <param name="image" type="image or canvas">An image created by <api>loadImage</api>, another canvas, or a video</param>
    <param name="dstX0" optional="true" type="Number">The left edge of the rectangle on canvas. Default is 0.</param>
    <param name="dstY0" optional="true" type="Number">The top edge of the rectangle on canvas. Default is 0.</param>
    <param name="dstWidth" optional="true" type="Number">The width of the rectangle on canvas. Default is <code>image.width</code></param>
    <param name="dstHeight" optional="true" type="Number">The height of the rectangle on canvas. Default is <code>image.height</code></param>
    <param name="srcX0" optional="true" type="Number">The left edge of the rectangle in <arg>image</arg>. Default is <code>0</code></param>
    <param name="srcY0" optional="true" type="Number">The top edge of the rectangle in <arg>image</arg>. Default is <code>0</code></param>
    <param name="srcWidth" optional="true" type="Number">The width of the rectangle in <arg>image</arg>. Default is <code>image.width</code></param>
    <param name="srcHeight" optional="true" type="Number">The height of the rectangle in <arg>image</arg>. Default is <code>image.height</code></param>
    <see><api>loadImage</api>, <api>drawTransformedImage</api>, <api>drawImageTriangle</api></see>
  </function>
 */
function drawImage(image, dstX0, dstY0, dstWidth, dstHeight, 
                   srcX0, srcY0, srcWidth, srcHeight) {

    _ch_checkArgs(arguments, 1, "drawImage(image, dstX0, <dstY0>, <dstWidth>, <dstHeight>, <srcX0>, <srcY0>, <srcWidth>, <srcHeight>)");

    if (image === undefined) { 
        _ch_error("You called drawImage with no image! ");
    }

    // Default arguments
    if (dstX0     === undefined) { dstX0     = 0; }
    if (dstY0     === undefined) { dstY0     = 0; }
    if (dstWidth  === undefined) { dstWidth  = image.width || image.videoWidth; }
    if (dstHeight === undefined) { dstHeight = image.height || image.videoHeight; }
    if (srcX0     === undefined) { srcX0     = 0; }
    if (srcY0     === undefined) { srcY0     = 0; }
    if (srcWidth  === undefined) { srcWidth  = image.width || image.videoWidth; }
    if (srcHeight === undefined) { srcHeight = image.height || image.videoHeight; }

    if (image.nodeType === undefined) {
        _ch_error("drawImage requires an image created by loadImage as the first argument.");
    }

    try {
        _ch_ctx.drawImage(image, srcX0, srcY0, srcWidth, srcHeight, 
                          dstX0, dstY0, dstWidth, dstHeight);
    } catch (e) { }
}


/** 
    <function name="drawTransformedImage" category="graphics">
      <description>
      <p>
      Draws the subset of <arg>image</arg> that is the rectangle
      with corner (<arg>sourceX</arg>, <arg>sourceY</arg>) and dimensions
      (<arg>sourceWidth</arg>, <arg>sourceHeight</arg>) to
      to the rectangle that is centered at (<arg>translateX</arg>, <arg>translateY</arg>),
      rotated counter-clockwise by <arg>rotate</arg> radians,
      and scaled by <arg>scaleX</arg>, <arg>scaleY</arg> from its
      original dimensions.  The transformations semantically occur in the order:
      scale, rotate, translate.      
      </p>
    </description>

    <param name="image" type="image or canvas">An image created by <api>loadImage</api>, another canvas, or a video</param>
    <param name="translateX" type="Number">The X center of the rectangle on canvas.</param>
    <param name="translateY" type="Number">The Y center of the rectangle on canvas. Default is 0.</param>
    <param name="rotate" optional="true" type="Number">Angle in radians to rotate the image. Default is <code>0</code></param>
    <param name="scaleX" optional="true" type="Number">Amount to scale by in the X dimension (before rotating).  Negative values flip the image. Default is <code>1</code></param>
    <param name="scaleY" optional="true" type="Number">Amount to scale by in the Y dimension (before rotating).  Negative values flip the image. Default is <code>1</code></param>
    <param name="sourceX" optional="true" type="Number">The left edge of the rectangle in <arg>image</arg>. Default is <code>0</code></param>
    <param name="sourceY" optional="true" type="Number">The top edge of the rectangle in <arg>image</arg>. Default is <code>0</code></param>
    <param name="sourceWidth" optional="true" type="Number">The width of the rectangle in <arg>image</arg>. Default is <code>image.width</code></param>
    <param name="sourceHeight" optional="true" type="Number">The height of the rectangle in <arg>image</arg>. Default is <code>image.height</code></param>

    <see><api>drawImage</api>, <api>loadImage</api></see>
    </function>
 */
function drawTransformedImage(image, translateX, translateY, rotate, scaleX, scaleY, 
                              sourceX, sourceY, sourceWidth, sourceHeight) {

    _ch_checkArgs(arguments, 3, "drawTransformedImage(image, translateX, translateY, <rotate>, <scaleX>, <scaleY>, <sourceX>, <sourceY>, <sourceWidth>, <sourceHeight>)");

    if (image === undefined) { 
        _ch_error("You called drawTransformedImage with no image! ");
    }
    
    rotate = (rotate === undefined) ? 0 : rotate;
    scaleX = (scaleX === undefined) ? 1 : scaleX;
    scaleY = (scaleY === undefined) ? 1 : scaleY;
    sourceX = (sourceX === undefined) ? 0 : sourceX;
    sourceY = (sourceY === undefined) ? 0 : sourceY;
    sourceWidth = (sourceWidth === undefined) ? (image.width || image.videoWidth) : sourceWidth;
    sourceHeight = (sourceHeight === undefined) ? (image.height || image.videoHeight) : sourceHeight;

    // Back up the current state of the canvas transform
    _ch_ctx.save();

    // Put the origin at the center of the image
    _ch_ctx.translate(translateX, translateY);

    // Rotate to the desired orientation
    _ch_ctx.rotate(rotate);

    _ch_ctx.scale(scaleX, scaleY);

    // Ignore exceptions if the image is not loaded
    try {
        // Draw the image
        _ch_ctx.drawImage(image, sourceX, sourceY, 
                          sourceWidth, sourceHeight,
                          -sourceWidth * 0.5, -sourceHeight * 0.5,
                          sourceWidth, sourceHeight);
    } catch (e) { }
    
    // Restore the old state of the canvas transform
    _ch_ctx.restore();
}


/** 
    Returns a mutated canvas that presents a three-point gradient. The
    canvas is modified each time that this is invoked, so use the
    result immediately.
 */
var _ch_makeTemporaryGradient = (function() {
    // Based on http://ricardocabello.com/blog/post/710

    // Used for dynamically creating gradient textures
    var gradientCanvas = document.createElement("canvas");

    gradientCanvas.width = gradientCanvas.height = 2;

    var gradientContext = gradientCanvas.getContext("2d");
    var gradientPixels  = gradientContext.getImageData( 0, 0, 2, 2 );
    var data = gradientPixels.data;

    return function(r0, g0, b0, a0, r1, g1, b1, a1, r2, g2, b2, a2) {
        data[0] = r0 * 256;  data[1]  = g0 * 256;  data[2]  = b0 * 256; data[3]  = a0 * 256;
        data[4] = r1 * 256;  data[5]  = g1 * 256;  data[6]  = b1 * 256; data[7]  = a1 * 256;
        data[8]  = r2 * 256; data[9]  = g2 * 256;  data[10] = b2 * 256; data[11] = a2 * 256;
        
        // Average of c1 and c2 for drawing a triangle
        data[12] = (r1 + r2) * 128;  data[13] = (g1 + g2) * 128;  data[14] = (b1 + b2) * 128;  data[15] = (a1 + a2) * 128;
        
        gradientContext.putImageData(gradientPixels, 0, 0);

        return gradientCanvas;
    };
})();


/**
   <function name="drawGradientTriangle" level="advanced" category="graphics">
    <description>
     Draws a screen-space bilinearly interpolated pixel-value gradient
     on a triangle.  Coordinates are in pixels, sRGB colors have elements on the range [0, 1].
     This function does not check its arguments, for performance.
   </description>
   <param name="x0" type="Number"></param>
   <param name="y0" type="Number"></param>
   <param name="x1" type="Number"></param>
   <param name="y1" type="Number"></param>
   <param name="x2" type="Number"></param>
   <param name="y2" type="Number"></param>
   <param name="r0" type="Number"></param>
   <param name="g0" type="Number"></param>
   <param name="b0" type="Number"></param>
   <param name="a0" type="Number"></param>
   <param name="r1" type="Number"></param>
   <param name="g1" type="Number"></param>
   <param name="b1" type="Number"></param>
   <param name="a1" type="Number"></param>
   <param name="r2" type="Number"></param>
   <param name="g2" type="Number"></param>
   <param name="b2" type="Number"></param>
   <param name="a2" type="Number"></param>
   <see><api>drawImageTriangle</api>, <api>fillTriangle</api>, <api>strokeTriangle</api></see>
   </function>
 */
function drawGradientTriangle
(x0, y0,
 x1, y1,
 x2, y2, 
 r0, g0, b0, a0,
 r1, g1, b1, a1,
 r2, g2, b2, a2) {
    drawImageTriangle(x0, y0, 
                      x1, y1, 
                      x2, y2, 
                      0.5 / 1.5, 0.5 / 1.5, 
                      1.5 / 1.5, 0.5 / 1.5,
                      0.5 / 1.5, 1.5 / 1.5, 
                      _ch_makeTemporaryGradient(r0, g0, b0, a0,
                                               r1, g1, b1, a1,
                                               r2, g2, b2, a2));
}

/** for use as new _ch_ImagePattern() */
function _ch_ImagePattern(image) {
    // Need to store 'this' so that it can be accessed inside the callback
    var pattern = this;
    this.image = image;
    delete image;

    function creator() {
	if (! pattern.image.loaded) {
	    // Wait a while longer for the image to load
	    setTimeout(creator, 5);
	} else {
	    // the _ch_ctx may not be bound yet, so create a new canvas
	    pattern.pattern = document.createElement("canvas").getContext("2d").createPattern(pattern.image, "repeat");
            // Allow the underlying image to be collected
            delete pattern.image;
	}
    }
    setTimeout(creator, 0);
}

/**
   <function name="createImagePattern" level="advanced" category="graphics">
   <description>
      Creates a tiling image pattern from the image (which must have been created by <api>loadImage</api>) or string filename, delaying the 
      actual creation as needed. This
      works around an HTML Canvas limitation where creating a pattern from
      an image that has not loaded fails.
   </description>
   <param name="image" type="string or image"></param>
   <return type="_ch_ImagePattern"/>
   <see><api>drawImageTriangle</api></see>
   </function>
 */
function createImagePattern(image) {
    if (isString(image)) {
	image = loadImage(image);
    }
    return new _ch_ImagePattern(image);
}

/**
   <function name="drawImageTriangle" level="advanced" category="graphics">
    <description>
    <p>
      Draws an affine texture-mapped triangle.  The (u, v) coordinates
      are in texture coordinates of the image, where (0, 0) is the upper
      left and (1, 1) is the lower right.
   </p>
   <p>
   </p>
   

   Based on <a href="https://github.com/mrdoob/three.js/blob/master/src/renderers/CanvasRenderer.js">THREE.js</a>,
   which is based on <a href="http://extremelysatisfactorytotalitarianism.com/blog/?p=2120">a blog post</a>,
   which is based on code by <a href="http://tulrich.com/geekstuff/canvas/jsgl.js">Thatcher Ulrich</a>. 
   </description>
   <param name="x0" type="Number"></param>
   <param name="y0" type="Number"></param>
   <param name="x1" type="Number"></param>
   <param name="y1" type="Number"></param>
   <param name="x2" type="Number"></param>
   <param name="y2" type="Number"></param>
   <param name="u0" type="Number"></param>
   <param name="v0" type="Number"></param>
   <param name="u1" type="Number"></param>
   <param name="v1" type="Number"></param>
   <param name="u2" type="Number"></param>
   <param name="v2" type="Number"></param>
   <param name="image" type="image, canvas, or pattern">The texture to apply. Can be a HTML pattern (which will then tile) created by <api>createImagePattern</api>, an HTML Image from <api>loadImage</api>, or an HTML canvas</param>
   <see><api>drawGradientTriangle</api>, <api>drawTransformedImage</api>, <api>fillTriangle</api>, <api>strokeTriangle</api></see>
   </function>
*/
function drawImageTriangle(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, image) {
    var a, b, c, d, e, f, w, h, det, idet;

    // Is this an image/canvas (vs. a pattern/color?)
    var isImage = (image instanceof Image) || (image instanceof HTMLCanvasElement);
    var isCHPattern = (image instanceof _ch_ImagePattern);

    // Set up the triangle path
    _ch_ctx.beginPath();
    _ch_ctx.moveTo(x0, y0);
    _ch_ctx.lineTo(x1, y1);
    _ch_ctx.lineTo(x2, y2);
    _ch_ctx.closePath();

    if (isImage) {
        // This offsetting helps avoid (but not eliminate)
        // sampling off the image borders at low resolution,
        // which makes edges slightly transparent. JavaScript
        // has no obvious way of clamping to the border.
        w = image.width - 0.5; h = image.height - 0.5;
        u0 *= w;  v0 *= h;
        u1 *= w;  v1 *= h;
        u2 *= w;  v2 *= h;
    } else if (isCHPattern) {
	w = image.image.width; h = image.image.height;
        u0 *= w;  v0 *= h;
        u1 *= w;  v1 *= h;
        u2 *= w;  v2 *= h;
	image = image.pattern;
    }

    x1 -= x0; y1 -= y0;
    x2 -= x0; y2 -= y0;
    
    u1 -= u0; v1 -= v0;
    u2 -= u0; v2 -= v0;
    
    det = u1 * v2 - u2 * v1;
    
    idet = 1 / det;
    
    a = (v2 * x1 - v1 * x2) * idet;
    b = (v2 * y1 - v1 * y2) * idet;
    c = (u1 * x2 - u2 * x1) * idet;
    d = (u1 * y2 - u2 * y1) * idet;
    
    e = x0 - a * u0 - c * v0;
    f = y0 - b * u0 - d * v0;
    
    // Clip the output to the on-screen triangle boundaries.
    _ch_ctx.save();
    if (isImage) {
        _ch_ctx.clip();
        _ch_ctx.transform(a, b, c, d, e, f);
        _ch_ctx.drawImage(image, 0, 0);
    } else {
        _ch_ctx.transform(a, b, c, d, e, f);
        _ch_ctx.fillStyle = image;
        _ch_ctx.fill();
    }
    _ch_ctx.restore();
}


/** <function name="strokeLine" category="graphics">
    <param name="x0" type="Number"></param>
    <param name="y0" type="Number"></param>
    <param name="x1" type="Number"></param>
    <param name="y1" type="Number"></param>
    <param name="color" type="color"></param>
    <param name="thickness" type="Number"></param>
    </function>
*/
function strokeLine(x0, y0, x1, y1, color, thickness) {
    _ch_checkArgs(arguments, 6, "strokeLine(x0, y0, x1, y1, color, thickness)");

    _ch_ctx.lineWidth   = thickness;
    _ch_ctx.strokeStyle = color;

    _ch_ctx.beginPath();
    _ch_ctx.moveTo(x0, y0);
    _ch_ctx.lineTo(x1, y1);
    //_ch_ctx.closePath();

    _ch_ctx.stroke();
}


/** <function name="makeColor" category="graphics">
      <description>Creates a color that can be used with the fill and stroke commands.</description> 

      <param name="r" type="Number">Red value on the range [0, 1]</param>
      <param name="g" type="Number">Green value on the range [0, 1]</param>
      <param name="b" type="Number">Blue value on the range [0, 1]</param>
      <param name="a" optional="true" type="Number">Opacity value on the range [0, 1]. Default is 1.</param>
      <return type="color"></return>
    </function>
 */
function makeColor(r, g, b, opacity) {
    _ch_checkArgs(arguments, 3, "makeColor(r, g, b, <a>)");

    if (typeof r !== 'number') {
        _ch_error("The arguments to makeColor() must all be numbers.");
    }

    opacity = (opacity === undefined) ? 1.0 : opacity;
    return "rgba(" + Math.round(r * 255.0) + ", " +
        Math.round(g * 255.0) + ", " + 
        Math.round(b * 255.0) + ", " + opacity + ")";
}


/** <function name="loadImage" category="graphics">
      <description>Loads an image from a URL

      <p>
       Example:
       <listing>
        var ROBOT_IMAGE = loadImage("http://graphics.cs.brown.edu/games/FeatureEdges/icon.jpg");
        var TEST_IMAGE  = loadImage("test.png");
       </listing>

       This is slow--only call it during <api>onSetup</api> or to create constants.
      </p>

      <p> Note that the function returns immediately but the picture
       data might not yet be available, especially if the player is on
       a slow internet connection.  The image.loaded field will be
       true when loading is complete.  Do not depend on image.width
       and image.height when loaded == false.  
      </p>

     </description>
     <param name="url" type="String"></param>
     <param name="onLoad" type="function" optional="true">
     If specified, this function is
     invoked when the image completes loading.  The image is passed to the function.
     </param>
     <return type="image"></return>
     <see><api>drawImage</api>, <api>drawTransformedImage</api>, <api>drawImageTriangle</api></see>
   </function>
*/ 
function loadImage(url, onLoad) {
    _ch_checkArgs(arguments, 1, "loadImage(url, <onLoad>)");
    var im = new Image();
    im.loaded = false;
    im.onload = function () { 
        if (! im.loaded) {
            im.loaded = true; 
            if (typeof onLoad === 'function') {
                _ch_safeApply(onLoad, im);
            }
        }
    }
    im.src = url;
    return im;
}


/** <function name="loadSound" category="sound">
      <description>Loads a sound file from a URL.  

    Example:

    <listing>
      var BOUNCE_SOUND = loadSound("bounce.wav");
      var HELLO_SOUND = loadSound("http://daddy.com/hello.mp3");
    </listing>
    <p>
    This is slow--only call it during <api>onSetup</api> or to create global constants.
    </p>
    <p>
    Different web browsers support different formats.  MP3 is the most
    widely supported.
    </p>
    </description>
    <param name="url" type="String"></param>
    <return type="Sound">The sound object (an HTML5 Audio object in this implementation)</return>
    <see><api>playSound</api>, <api>stopSound</api>, <api>playingSound</api></see>
   </function>
*/
function loadSound(url) {
    _ch_checkArgs(arguments, 1, "loadSound(url)");

    if (_ch_audioContext) {
        // Use asynchronous loading
        var sound = Object.seal({ src: url, 
                                  loaded: false, 
                                  source: null,
                                  buffer: null,
                                  playing: false });
        
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        
        // Decode asynchronously
        request.onload = function() {
            _ch_audioContext.decodeAudioData(request.response, 
                                             function onSuccess(buffer) {
                                                 sound.buffer = buffer;
                                                 sound.loaded = true;

                                                 // Create a buffer, which primes this sound for playing
                                                 // without delay later.
                                                 sound.source = _ch_audioContext.createBufferSource();
                                                 sound.source.buffer = sound.buffer;
                                                 sound.source.connect(_ch_audioContext.destination);
                                             }, 
                                             function onFailure() {
                                                 console.warn("Could not load sound " + url);
                                             });
        };
        
        sound.playing = false;
        request.send();
        return sound;

    } else {
        // Legacy and local Chrome path
        var s = new Audio();
        s.src = url;
        s.preload = "auto";
        
        s.playing = false;
        s.onended = function() { s.playing = false; };
        s.onpause = s.onended;

        if (false) {
            // iOS used to be unable to load sounds until a user event occured. We
            // now use Web Audio on iOS but retain this code in case a future platform
            // imposes the same restriction.
            _ch_soundLoadQueue.push(s);
        } else {
            s.load();
        }
        return s;
    }
}


/**
   <function name="playSound" category="sound">
     <description>Plays the sound file <arg>s</arg> that was created by
      <api>loadSound</api>.
      For a looped sound, it is often easiest to call <api>playSound</api>
      every <api>onTick</api> that it should be playing rather than 
      tracking when to explicitly start and stop it.
     </description>
     <param name="sound" type="Sound"></param>
     <param name="loop" type="Boolean" optional="true">If true, then the sound will play in a continuous loop until <api>stopSound</api> is called on it.  
         A looped sound will play from wherever it was last stopped. 
         If false, then the sound will only play once but can still be stopped before completion. False is the default.</param>
     <see><api>loadSound</api>, <api>stopSound</api>, <api>playingSound</api></see>
   </function>
 */
function playSound(sound, loop) {
    _ch_checkArgs(arguments, 1, "playSound(sound, <loop>)");

    // Ensure that the value is a boolean
    loop = loop ? true : false;

    if (_ch_audioContext) {
        if (sound.loaded) {
            // A new source must be created every time that the sound is played
            sound.source = _ch_audioContext.createBufferSource();
            sound.source.buffer = sound.buffer;
            sound.source.connect(_ch_audioContext.destination);
            sound.source.loop = loop;
            sound.source.onended = function () {
                sound.source = null;
                sound.playing = false; 
            };

            if (! sound.source.start) {
                // Backwards compatibility
                sound.source.start = sound.source.noteOn;
                sound.source.stop  = sound.source.noteOff;
            }
            
            sound.playing = true;
            sound.source.start(0);
        }
    } else {
        // Legacy support
        if (_ch_audioContext && ! sound.webAudioSound) {
            // Force the sound through the Web Audio API for lower
            // latency playback on Chrome. 
            // Do this the first time, and then mark as webaudio for the future
            sound.webAudioSound = _ch_audioContext.createMediaElementSource(sound);
            sound.webAudioSound.connect(_ch_audioContext.destination);
        }
        
        try {
            // Reset the sound
            if (! loop) {
                sound.currentTime = 0;
            }
            
            // Avoid changing properties unless required because the 
            // browser's implementation may be inefficient.
            if (sound.loop != loop) {
                sound.loop = loop;
            }
            
            // Only play if needed
            if (! loop || sound.paused || sound.ended) {
                sound.play();
                sound.playing = true;
            }
        } catch (e) {
            // Ignore invalid state error if loading has not succeeded yet
        }
    } // web audio
}


/**
   <function name="playingSound" category="sound">
     <description>True if <arg>s</arg> is currently set to play.
     </description>
     <param name="sound" type="Sound"></param>
     <see><api>loadSound</api>, <api>playSound</api>, <api>stopSound</api></see>
   </function>
 */
function playingSound(s) {
    _ch_checkArgs(arguments, 1, "playingSound(sound)");
    if (! _ch_audioContext) {
        return (! s.paused && ! s.ended && s.playing);
    } else {
        return sound.playing;
    }
}


/**
   <function name="stopSound" category="sound">
     <description>Stops the sound file <arg>s</arg> if it was playing.
     </description>
     <param name="sound" type="Sound"></param>
     <see><api>loadSound</api>, <api>playSound</api>, <api>playingSound</api></see>
   </function>
 */
function stopSound(s) {
    _ch_checkArgs(arguments, 1, "stopSound(sound)");

    if (! _ch_audioContext) {
        try {
            // Only stop if required to do something
            if (! (s.paused || s.ended)) {
                s.pause();
                s.playing = false;
            }
        } catch (e) {
            // Ignore invalid state error if loading has not succeeded yet
        }
    } else if (s.playing) {
        s.source.stop(0);
        s.playing = false;
        s.source = null;
    }
}


////////////////////////////////////////////////////////////////////

/**
    <function name="defineGlobals" level="advanced" category="core">
      <description>
        Exports all of the elements of object <arg>module</arg> into the
        global namespace by name.
      </description>
      <param name="module" type="Object"></param>
    </function>
*/
function defineGlobals(module) {
    _ch_checkArgs(arguments, 1, "defineGlobals(module)");

    var global = (function() { return this; }).call();
    for (name in module) {
        global[name] = module[name];
    }
}


/**
   <function name="vec2" level="advanced" category="vector">
   <description>
   If two arguments are provided, intializes a 2D vector useful for representing
   vectors, directions, or points.  If only one argument is provided, then that
   argument must be a 2D vector and it will be cloned.
   </description>
   <param name="x" type="Number"></param>
   <param name="y" type="Number" optional="true"></param>
   <see>
   <api>add</api>, 
   <api>sub</api>,
   <api>mul</api>, 
   <api>div</api>, 
   <api>dot</api>, 
   <api>direction</api>, 
   <api>magnitude</api> 
   </see>
   <return type="object">A new 2D vector.</return>
   </function>
*/
function vec2(x, y) {
    if (y === undefined) {
        // Clone
        _ch_checkExactArgs(arguments, 1, "vec2(v)");
        return Object.seal({x:x.x, y:x.y});
    } else {
        // Construct
        _ch_checkExactArgs(arguments, 2, "vec2(x, y)");
        return Object.seal({x:x, y:y});
    }
}


/**
   <function name="vec3" level="advanced" category="vector">
   <description>
   If two arguments are provided, intializes a 3D vector useful for representing
   vectors, directions, or points.  If only one argument is provided, then that
   argument must be a 3D vector and it will be cloned.
   </description>
   <param name="x" type="Number"></param>
   <param name="y" type="Number" optional="true"></param>
   <param name="z" type="Number" optional="true"></param>
   <see>
   <api>add</api>, 
   <api>sub</api>,
   <api>mul</api>, 
   <api>div</api>, 
   <api>dot</api>, 
   <api>direction</api>, 
   <api>magnitude</api>,
   <api>vec2</api>
   </see>
   <return type="object">A new 3D vector.</return>
   </function>
*/
function vec3(x, y, z) {
    if (z === undefined) {
        // Clone
        _ch_checkExactArgs(arguments, 1, "vec3(v)");
        return Object.seal({x:x.x, y:x.y, z:x.z});
    } else {
        // Construct
        _ch_checkExactArgs(arguments, 3, "vec3(x, y, z)");
        return Object.seal({x:x, y:y, z:z});
    }
}


/**
  <function name="isNumber" category="datastructure">
   <description>
   Returns true if the argument is a number. (Note that this returns true for NaN, which is an IEEE floating point "number", just not a mathematical "number")
   </description>
   <param name="x" type="any"></param>
   <return type="Boolean"></return>
   </function>
 */
function isNumber(x) {
    return (typeof(x) === "number");
}

/**
  <function name="isBoolean" category="datastructure">
   <description>
   Returns true if the argument is a number.
   </description>
   <param name="x" type="any"></param>
   <return type="Boolean"></return>
   </function>
 */
function isBoolean(x) {
    return (typeof(x) === "boolean");
}

/**
  <function name="isArray" category="datastructure">
   <description>
   Returns true if the argument is an array.
   </description>
   <param name="x" type="any"></param>
   <return type="Boolean"></return>
   </function>
 */
function isArray(x) {
    // JS 1.5 version, works on iOS 5+, Chrome, Safari, IE, Firefox
    return Array.isArray(x);

    // Old, pre-JS 1.5 version:
    // First check for some array method before calling the potentially slow toString method
    // return (x !== undefined) && (x.push !== undefined) && (Object.prototype.toString.call(x) === "[object Array]");
}

/**
  <function name="isString" category="datastructure">
   <description>
   Returns true if the argument is a string.
   </description>
   <param name="x" type="any"></param>
   <return type="Boolean"></return>
   </function>
 */
function isString(x) {
    return (typeof(x) === "string");
}


/**
  <function name="isObject" category="datastructure">
   <description>
   Returns true if the argument is an object (and not an array)
   </description>
   <param name="x" type="any"></param>
   <return type="Boolean"></return>
   </function>
 */
function isObject(x) {
    return (typeof(x) === "object") && ! isArray(x);
}


/**
  <function name="isFunction" category="datastructure">
   <description>
   Returns true if the argument is a function.
   </description>
   <param name="x" type="any"></param>
   <return type="Boolean"></return>
   <see>
   <api>isObject</api>,
   <api>isArray</api>,
   <api>isNumber</api>,
   <api>isString</api>,
   <api>isBoolean</api>,
   </see>
   </function>
 */
function isFunction(x) {
    return (typeof(x) === "function");
}


/**
  <function name="add" level="advanced" category="vector">
   <description>
    <p>
     General vector, scalar, array, and object addition. Note that
     scalar addition can be performed with the + operator and that
     when adding large arrays of values it may be substantially
     faster to write an explicit loop.
    </p>
    <p>
     Produces a number, array, or object in which each property or element of <arg>a</arg>
     is added to the corresponding property or element of <arg>b</arg>.  
    </p>
    <p>
     Preserves the prototype of the first non-scalar argument, so that
     operating on a specific library's vector object (such as
     Box2d.b2Vec2) yields an object that is likely to still work as
     expected within that library.
    </p>
   </description>
   <param name="a" type="any"></param>
   <param name="b" type="any"></param>
   <return type="varies"></return>
  </function>
*/
function add(a, b) {
    _ch_checkExactArgs(arguments, 2, 'add(a, b)');
    return _ch_vecApply('add', _ch_add, a, b);
}
function _ch_add(x, y) { return x + y; }


/**
  <function name="sub" level="advanced" category="vector">
   <description>
     General vector, scalar, array, and object subtraction.
     See the notes on <api>add</api>.
   </description>
   <param name="a" type="any"></param>
   <param name="b" type="any"></param>
   <return type="varies"></return>
  </function>
*/
function sub(a, b) {
    _ch_checkArgs(arguments, 2, "sub(a, b)");
    return _ch_vecApply('sub', _ch_sub, a, b);
}
function _ch_sub(x, y) { return x - y; }


/**
  <function name="div" level="advanced" category="vector">
   <description>
     General vector, scalar, array, and object division.
     See the notes on <api>add</api>.
     <p>
     Always applies array (a.k.a., Haddamard, pointwise) quotient rules.
     It will not perform matrix, polynomial, or complex number quotients, for example.
     </p>
   </description>
   <param name="a" type="any"></param>
   <param name="b" type="any"></param>
   <return type="varies"></return>
  </function>
*/
function div(a, b) {
    _ch_checkArgs(arguments, 2, "div(a, b)");
    return _ch_vecApply('div', _ch_div, a, b);
}
function _ch_div(x, y) { return x / y; }


/**
  <function name="mul" level="advanced" category="vector">
   <description>
     General vector, scalar, array, and object multiplication.
     See the notes on <api>add</api>.
     <p>
     Always applies array (a.k.a., Haddamard, pointwise) product rules.
     It will not perform matrix, polynomial, or complex number products, for example.
     </p>
   </description>
   <param name="a" type="any"></param>
   <param name="b" type="any"></param>
   <return type="varies"></return>
  </function>
*/
function mul(a, b) {
    _ch_checkExactArgs(arguments, 2, "mul(a, b)");
    return _ch_vecApply('mul', _ch_mul, a, b);
}
function _ch_mul(x, y) { return x * y; }


/**
   <function name="direction" level="advanced" category="vector">
     <description>
       Returns the <arg>a</arg> divided by its magnitude.  If the 
       argument has zero magnitude, returns the product of 0 and
       the argument.
     </description>
     <param name="a" type="any"></param>
     <see><api>magnitude</api></see>
     <return type="varies"></return>
   </function>
 */
function direction(v) {
    _ch_checkExactArgs(arguments, 1, "direction(v)");
    var m = magnitude(v);
    if (m === 0) {
        return mul(v, 0);
    } else {
        return div(v, m);
    }
}

function _ch_square(x) {
    return x * x;
}


/**
   <function name="dot" level="advanced" category="vector">
     <description>
       Returns the vector dot product of <arg>a</arg> and <arg>b</arg>.
     </description>
     <param name="a" type="any"></param>
     <param name="b" type="any"></param>
     <return type="varies"></return>
   </function>
 */
function dot(a, b) {
    _ch_checkExactArgs(arguments, 2, "dot(a, b)");
    var c = 0, i, p;
    if (isNumber(a)) {
        c = a * b;
    } else if (isArray(a)) {
        for (i = 0; i < a.length; ++i) c += a[i] * b[i];
    } else {
        for (p in a) if (a.hasOwnProperty(p)) c += a[p] * b[p];
    }
    return c;
}


/**
   <function name="cross" level="advanced" category="vector">
     <description>
       Returns the vector cross product product of <arg>a</arg> and <arg>b</arg>.
     </description>
     <param name="a" type="vec2 or vec3"></param>
     <param name="b" type="vec2 or vec3"></param>
     <return type="vec3 or Number">If the arguments have z components, then the result will be a vec3. Otherwise
     the return will be a scalar "2D cross product".</return>
   </function>
 */
function cross(a, b) {
    _ch_checkExactArgs(arguments, 2, "cross(a, b)");
    if ('z' in a) {
        return vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    } else {
        // Compute just the "Z" coordinate
        return a.x * b.y - a.y * b.x;
    }
}


/**
   <function name="magnitude" level="advanced" category="vector">
     <description>
       Returns the Euclidean vector length (L2 norm, square root of the sum of squares)
       of elements of <arg>a</arg>.
     </description>
     <param name="a" type="any"></param>
     <see><api>direction</api></see>
     <return type="Number"></return>
   </function>
 */
function magnitude(v) {
    _ch_checkExactArgs(arguments, 1, "magnitude(v)");
    var c = 0, i = 0, p;
    if (isNumber(v)) {
        c = Math.abs(v);
    } else if (isArray(v)) {
        for (i = 0; i < v.length; ++i) c += _ch_square(v[i]);
        c = sqrt(c);
    } else {
        for (p in v) if (v.hasOwnProperty(p)) c += _ch_square(v[p]); 
        c = sqrt(c);
    }
    return c;
}

/* 
   Applies arithmetic vector op to all elements of a and b.
   If one is an object, then the result is also an object
 */
function _ch_vecApply(opname, op, a, b) {
    var c, i, p;
    
    var noB = arguments.length <= 3;
    if (isNumber(a)) {
        if (noB || isNumber(b)) {
            c = op(a, b);
        } else if (isArray(b)) {
            // scalar + array
            c = [];
            for (i = 0; i < b.length; ++i) c[i] = op(a, b[i]);
        } else {
            // scalar + object
            c = Object.create(Object.getPrototypeOf(b));
            for (p in b) if (b.hasOwnProperty(p)) c[p] = op(a, b[p]);
        }
    } else if (! noB && isNumber(b)) {
        if (isArray(a)) {
            c = [];
            for (i = 0; i < a.length; ++i) c[i] = op(a[i], b);
        } else {
            // object + scalar
            c = Object.create(Object.getPrototypeOf(a));
            for (p in a) if (a.hasOwnProperty(p)) c[p] = op(a[p], b);
        }
    } else if (isArray(a)) {
        if (noB) {
            c = [];
            for (i = 0; i < a.length; ++i) c[i] = op(a[i]);
        } else {
            // array + array
            if (! noB && ! isArray(b)) _ch_error('Cannot apply ' + opname + ' an array and an object');
            if (! noB && (a.length !== b.length)) _ch_error('Cannot apply ' + opname + ' to arrays of different lengths');
            c = [];
            for (i = 0; i < a.length; ++i) c[i] = op(a[i], b[i]);
        }
    } else if (noB) {
        c = Object.create(Object.getPrototypeOf(a));
        for (p in a) if (a.hasOwnProperty(p)) c[p] = op(a[p]);
    } else {
        // object + object
        if (isArray(b)) _ch_error('Cannot apply ' + opname + ' an object and an array');
        p = Object.getPrototypeOf(a);
        if ((p !== Object.getPrototypeOf(b))) _ch_error('Cannot apply ' + opname + ' to ' + a + ' and ' + b + ' because they have different prototypes');
        c = Object.create(p);
        for (p in a) if (a.hasOwnProperty(p)) c[p] = op(a[p], b[p]);
    }

    return c;
}


/** 
    <function name="makeArray" category="datastructure">
       <description>
         <p>
           makeArray(w) makes a 1D array of <arg>w</arg> 
           undefined elements.
         </p>
         <p>
           makeArray(w, h) makes an array of <arg>w</arg> arrays.
           Each of those arrays is an array of <arg>h</arg>
           undefined elements.
         </p>
      </description>
      <param name="w" type="Number"></param>
      <param name="h" type="Number" optional="true"></param>
      <param name="d" type="Number" optional="true"></param>
      <return type="Array"></return>
    </function>
    */
function makeArray(xlength, ylength, zlength) {
    xlength = xlength || 0;

    var a = new Array(xlength);

    if (ylength !== undefined) {
        var x;
        for (x = 0; x < xlength; ++x) {
            a[x] = makeArray(ylength, zlength);
        }
    }

    return a;
}


/** 
    <function name="makeObject" category="datastructure">
       <description>
         <p>
           makeObject() makes an empty object.
         </p>
      </description>
      <return type="Object"></return>
      <see><api>makeArray</api></see>
    </function>
    */
function makeObject() {
    return new Object();
}

/** 
    <function name="resizeArray" category="datastructure">
       <description>
         <p>
           Changes the length of an Array.
         </p>
      </description>
      <param name="a" type="Array">The array to change</param>
      <param name="n" type="Number">The new length of the array</param>
      <see><api>makeArray</api></see>
    </function>
    */
function resizeArray(a, n) {
    _ch_checkArgs(arguments, 2, "resizeArray(a, n)");
    if (n > a.length) {
        // Grow
        a[n - 1] = undefined;
    } else if (n < a.length) {
        // Shrink
        a.splice(n, a.length - n);
    }
}


/**
   <function name="use" level="advanced" category="core">
     <description>
       Enable an advanced codeheart.js APIs that is disabled by default to save resources. 
       This must be called from game.js at the top level. 
       Functions in APIs that are enabled with <api>use</api> may not themselves be invoked
       at the top level.
     </description>
     <param name="api" type="String">The only current supported API is <code>"online"</code>.</param>
   </function>
 */
function use(api) {
    if (api === 'online') {
        _ch_includeOnline();
    }
}

////////////////////////////////////////////////////

/**
   <function name="sprintf" level="advanced" category="datastructures">
     <description>
       C-style sprintf, using the same argument conventions.
     </description>
     <param name="s" type="String">
       Formatting string.
     </param>
     <param name="...">
       Values to be formatted according to <arg>s</arg>.
     </param>
     <return type="String"></return>
   </function>
 */
/* sprintf.js | Copyright (c) 2007-2013 Alexandru Marasteanu <hello at alexei dot ro> | 3 clause BSD license */
(function(ctx) {
    var sprintf = function() {
        if (!sprintf.cache.hasOwnProperty(arguments[0])) {
            sprintf.cache[arguments[0]] = sprintf.parse(arguments[0]);
            }
        return sprintf.format.call(null, sprintf.cache[arguments[0]], arguments);
        };

    sprintf.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i]);
            if (node_type === 'string') {
                output.push(parse_tree[i]);
                }
            else if (node_type === 'array') {
                match = parse_tree[i]; // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor];
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
                            }
                        arg = arg[match[2][k]];
                        }
                    }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]];
                    }
                else { // positional argument (implicit)
                    arg = argv[cursor++];
                    }

                if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
                    throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
                    }
                switch (match[8]) {
                    case 'b': arg = arg.toString(2); break;
                    case 'c': arg = String.fromCharCode(arg); break;
                    case 'd': arg = parseInt(arg, 10); break;
                    case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
                    case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
                    case 'o': arg = arg.toString(8); break;
                    case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
                    case 'u': arg = arg >>> 0; break;
                    case 'x': arg = arg.toString(16); break;
                    case 'X': arg = arg.toString(16).toUpperCase(); break;
                    }
                arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
                pad_character = match[4] ? match[4] === '0' ? '0' : match[4].charAt(1) : ' ';
                pad_length = match[6] - String(arg).length;
                pad = match[6] ? str_repeat(pad_character, pad_length) : '';
                output.push(match[5] ? arg + pad : pad + arg);
                }
            }
        return output.join('');
        };

    sprintf.cache = {};

    sprintf.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
        while (_fmt) {
            if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
                parse_tree.push(match[0]);
                }
            else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
                parse_tree.push('%');
                }
            else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [], replacement_field = match[2], field_match = [];
                    if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1]);
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                                }
                            else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                                }
                            else {
                                throw('[sprintf] huh?');
                                }
                            }
                        }
                    else {
                        throw('[sprintf] huh?');
                        }
                    match[2] = field_list;
                    }
                else {
                    arg_names |= 2;
                    }
                if (arg_names === 3) {
                    throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
                    }
                parse_tree.push(match);
                }
            else {
                throw('[sprintf] huh?');
                }
            _fmt = _fmt.substring(match[0].length);
            }
        return parse_tree;
        };

    var vsprintf = function(fmt, argv, _argv) {
        _argv = argv.slice(0);
        _argv.splice(0, 0, fmt);
        return sprintf.apply(null, _argv);
        };

    /**
        * helpers
         */
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
        }

    function str_repeat(input, multiplier) {
        for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
        return output.join('');
        }

    /**
        * export to either browser or node.js
         */
    ctx.sprintf = sprintf;
    ctx.vsprintf = vsprintf;
})(typeof exports != "undefined" ? exports : window);


/** 
    <function name="download" category="core" level="advanced">
      <description>
      <p>
        Triggers a download of the file at the url. For security reasons,
        some web browsers  will only allow this to be invoked from a user 
        input event handler such as onKeyStart.
       </p>
       <p>
        This is particularly useful when making level editors and art tools
        to allow downloading of a generated file. See the JavaScript
        <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify">JSON.stringify</a> and <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI</a> APIs and the HTML <a href="http://en.wikipedia.org/wiki/Data_URI_scheme#HTML">data URI</a> scheme.
       </p>
        Examples:
        
        <listing>
           // Download a file named "data.zip"
           download("data.zip", "data.zip");

           // Download the codeheart logo
           download("http://codeheartjs.com/title.png", "title.png");

           // Download the current screen as an image
           download(canvas.toDataURL("image/png"), "screenshot.png");
        </listing>
      </description>
      <param name="url" type="String">The URL from which to download</param>
      <param name="filename" type="String">The suggested name for the file when saved</param>
      <return type="undefined">none</return>
    </function>
*/
function download(url, filename) {
    _ch_checkArgs(arguments, 2, "download(url, filename)");
    var downloader = document.createElement("a");
    downloader.href = url;
    downloader.download = filename;
    if (downloader.click) {
        downloader.click();
    } else if (document.createEvent) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null); 
        downloader.dispatchEvent(evt);
    } else {
        // Change the mime type to force the browser to download
        // as a binary instead of displaying in a tab.
        window.open(imageAsURL.replace(/^data:image\/[^;]/, 'data:application/octet-stream'));
    }
}



/////////////////////////////////////////////////////////////////////
//
// Online API


function _ch_includeOnline() {
    // var i = _ch_sourceURL.lastIndexOf('/');
    // var socketURL = _ch_sourceURL.substring(0, i + 1);

    // Fetch from the CDN to avoid load on the relay server
    document.write('<script src="https://cdn.socket.io/socket.io-1.2.1.js"></script>' +
                   // Prevent a user variable from smashing the variable io by accident
                   
                   '<script>codeheart.io = io;</script>');
}

var _ch_socket  = null;

// All times in ms
var _ch_SOCKET_OPTIONS = 
    {
        'log level': 3,            // 3 = debug,  0 = errors only
        'browser client' : false,  // don't serve the client files
        'try multiple transports' : true,
        'connect timeout' : 1000,  // the documentation is ambiguous on the capitalization, but this is what the code uses
        'reconnect': false,        // Applications should explicitly invoke connect when they are disconnected
        'reconnection delay': 250, // Initial delay in milliseconds, seems to double with each attempt
        'max reconnection attempts': 6,
        'transports': ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling', 'flashsocket']
    };


// Make the output visible
var _ch_serverLog = null;//document.getElementById('_ch_serverLog');
var _ch_clientLog = null;//document.getElementById('_ch_clientLog');

/**
    Add htmlMsg to debug log logElement.
    If br is true (default) appends '<br/>';
 */
function _ch_log(logElement, htmlMsg, br) {
    if (logElement) {
        br = br || true;
        logElement.innerHTML += htmlMsg + (br ? '<br/>' : false);
    }
}


// Work around a bug with connecting after disconnect in the socket.IO library.  This resets
// the socket library state (https://github.com/LearnBoost/socket.io-client/issues/251)
function _ch_resetSocketIO() {
   for (var url in codeheart.io.sockets) {
      delete codeheart.io.sockets[url]; 
   }
   codeheart.io.j = [];   
}

/**
   <function name="generateUniqueID" level="advanced" category="math">
      <description>
      <p>
        Generates a string that is almost-certainly unique, even if other 
        applications are calling the same function at nearly the same time.
      </p>
      <p>
        The result is compliant with the <a href="http://www.ietf.org/rfc/rfc4122.txt">RFC4122 UUID</a> specification.
      </p>
      </description>
      <return type="String">The new ID</return>
   </function>
 */
function generateUniqueID(){
    _ch_checkArgs(0, 'generateUniqueID()');

    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
};

/////////////////////////////////////// Server Support //////////////////////////////////////////////////////

// Intentionally offline
var _ch_ServerState = Object.freeze({
    OFFLINE : 'OFFLINE',
    ONLINE  : 'ONLINE',

    /** Between openOnlineGame or joinOnlineGame and the 'connect' message. */
    CONNECTING : 'CONNECTING',

    /** Between receiving a 'kickClient' message and receiving the 'disconnect' message. */
    BEING_KICKED : 'BEING_KICKED',

    /** Between closeOnlineGame or 'closeOnlineGame' message and the 'disconnect' message. */
    SERVER_DISCONNECTING : 'SERVER_DISCONNECTING',

    /** Between leaveOnlineGame and the 'disconnect' message. */
    CLIENT_DISCONNECTING : 'CLIENT_DISCONNECTING',

    /** The network connection has been unexpectedly cut */
    DISRUPTED : 'DISRUPTED'
});

var _ch_server = 
    {
        // If _ch_socket is null (which requires relayURL=''), then
        // the server is not actually using a network connection.

        state:  _ch_ServerState.OFFLINE,
        gameName: '',
        serverName: '',
        relayURL: '',
        clientTable: {}
    };


/** <function name="openOnlineGame" level="advanced" category="online">
       <require>online</require>

       <description>
       <p>
         Invoked by the server to open the game to online players.  The game
         is not available online until the <api>onOpenOnlineGame</api> event occurs.
         Most servers also create a client that connects to the game running locally.
        </p>
       </description>

       <param name="relayURL" type="String">URL of a codeheart.js relay server that you have 
          permission to use, e.g., maybe <code>"http://relay.cs.foo.edu:25560"</code>
          if you are at Foo University. If you'd like to run our own relay server,
          then look at the instructions <a href="http://codeheartjs.com/1.6/relay.js">relay.js</a> file 
          provided with the codeheart.js distribution.</param>

       <param name="gameName" type="String">The name of your game application, e.g., "Street Racers"</param>

       <param name="serverName" type="String">The name of this particular server/hosted game instance, 
          which is usually chosen by the player</param>

       <see><api>leaveOnlineGame</api>, <api>closeOnlineGame</api>,
            <api>joinOnlineGame</api>, <api>onOpenOnlineGame</api></see>
    </function>
*/
function openOnlineGame(relayURL, gameName, serverName) {
    _ch_checkArgs(3, 'openOnlineGame(relayURL, gameName, serverName)');

    if (_ch_server.state !== _ch_ServerState.OFFLINE) {
        _ch_error('Cannot open online game while already connected.');
    }

    _ch_server.relayURL = relayURL;
    _ch_server.gameName = gameName;
    _ch_server.serverName = serverName;
    
    if (_ch_socket !== null) {
        _ch_error('Cannot open online game while connection exists to any game.');
    }

    _ch_resetSocketIO();
    _ch_clientTable = {};
    _ch_socket = null;

    _ch_log(_ch_serverLog, 'Connecting to relay at ' + relayURL); 

    _ch_server.state = _ch_ServerState.CONNECTING;

    if (relayURL === '') {

        // Virtual network connection
        setTimeout(function () {
            _ch_log(_ch_serverLog, 'Connected to relay.');
            _ch_serverProcess_onOpenOnlineGame({relayNotes: 'virtual relay'});
        }, 0);
        
        return;
    } 

    _ch_socket = codeheart.io.connect(relayURL, _ch_SOCKET_OPTIONS);
    
    // TCP connection initialized
    _ch_socket.on('connect', function () {
        // Successfully connected or reconnected to the server
        _ch_log(_ch_serverLog, 'Connected to relay.');
        
        // Register with the server
        _ch_socket.emit('openOnlineGame', {gameName: gameName, serverName: serverName});
        
        if (_ch_server.state !== _ch_ServerState.CONNECTING) {
            _ch_log(_ch_serverLog, 'Warning: received Socket.IO connect event while in state ' + _ch_server.state);
        }
    });
    
    _ch_socket.on('onOpenOnlineGameFail', function (msg) {
        _ch_log(_ch_serverLog, 'Connect failed because ' + msg.reason);

        // Invoke the codeheart.js event
        if (typeof onOpenOnlineGameFail === 'function') {
            _ch_safeApply(onOpenOnlineGameFail, msg.reason);
        }

        if (_ch_server.state !== _ch_ServerState.CONNECTING) {
            _ch_log(_ch_serverLog, 'Warning: received Socket.IO onOpenOnlineGameFail event while in state ' + 
                    _ch_server.state);
        }
    });


    // 'connect_failed' does not actually fire in most cases
    // https://github.com/LearnBoost/socket.io-client/issues/375
    // http://stackoverflow.com/questions/8588689/node-js-socket-io-client-connect-failed-event
    _ch_socket.socket.on('error', function () {
        if (_ch_server.state === _ch_ServerState.CONNECTING) {
            _ch_log(_ch_serverLog, 'Connect failed because unreachable');

            // Invoke the codeheart.js event
            if (typeof onOpenOnlineGameFail === 'function') {
                _ch_safeApply(onOpenOnlineGameFail, 'unreachable');
            }
        }
    });

    _ch_socket.on('onOpenOnlineGame', _ch_serverProcess_onOpenOnlineGame);
    _ch_socket.on('joinOnlineGame',   _ch_serverProcess_joinOnlineGame);
    _ch_socket.on('message',          _ch_serverProcess_message);
    _ch_socket.on('leaveOnlineGame',  _ch_serverProcess_leaveOnlineGame);
    _ch_socket.on('disconnect',       _ch_serverProcess_disconnect);
}


/** If the server loses connection to the relay */
function _ch_serverProcess_disconnect() {
    _ch_log(_ch_serverLog, 'Disconnected from relay.');

    if (_ch_server.state === _ch_ServerState.CONNECTING) {
        // We've already handled the failure elsewhere
        
        // TODO: Set up retries
        
    } else if (_ch_server.state === _ch_ServerState.SERVER_DISCONNECTING) {
        // We've just closed our connection intentionally
        
        if (typeof onCloseOnlineGame === 'function') {
            _ch_safeApply(onCloseOnlineGame, 'closeOnlineGame');
        }
        
    } else if (_ch_server.state === _ch_ServerState.ONLINE) {
        // The network was disrupted

        // Disconnect the local client as well, to match the semantics
        // of remote clients.
        if (_ch_client.isLocal) {
            _ch_clientProcess_disconnect();
        }
        
        if (typeof onCloseOnlineGame === 'function') {
            _ch_safeApply(onCloseOnlineGame, 'disrupted');
        }
        
    } else {
        _ch_log(_ch_serverLog, 'Warning: received Socket.IO disconnect event while in state ' + 
                _ch_server.state);
    }
    
    _ch_server.state = _ch_ServerState.OFFLINE;
}



/** A client is joining */
function _ch_serverProcess_joinOnlineGame(msg) {
    _ch_log(_ch_serverLog,  msg.clientID + ' connected remotely.');
    _ch_server.clientTable[msg.clientID] = {isLocal: false};
    if (typeof onClientJoin === 'function') {
        _ch_safeApply(onClientJoin, msg.clientID);
    }
}


/** After successful registration with a relay */
function _ch_serverProcess_onOpenOnlineGame(msg) {
    _ch_log(_ch_serverLog, 'Registered with relay.');
    _ch_log(_ch_serverLog, 'Relay notes for developer: "' + msg.relayNotes + '"');

    // Print the relay notes so that the developer is guaranteed to see them
    console.log(msg.relayNotes);

    // Invoke the codeheart.js event
    if (typeof onOpenOnlineGame === 'function') {
        _ch_safeApply(onOpenOnlineGame);
    }
    
    if (_ch_server.state !== _ch_ServerState.CONNECTING) {
        _ch_log(_ch_serverLog, 'Warning: received Socket.IO onOpenOnlineGame event while in state ' + 
                _ch_server.state);
    }
    
    _ch_server.state = _ch_ServerState.ONLINE;
}


/** Client is leaving the game */
function _ch_serverProcess_leaveOnlineGame(msg) {
    _ch_log(_ch_serverLog, msg.clientID + ' disconnected.');
    
    // Find the client
    delete _ch_server.clientTable[msg.clientID];
    
    if (typeof onClientDisconnect === 'function') {
        _ch_safeApply(onClientLeave, msg.clientID);
    }
}


function _ch_serverProcess_message(msg) {
    _ch_log(_ch_serverLog, msg.clientID + ': ' + msg.data);
    if (typeof onReceiveFromClient === 'function') {
        _ch_safeApply(onReceiveFromClient, msg.clientID, msg.type, msg.data);
    }
}


/** <function name="sendToClient" level="advanced" category="online">
       <require>online</require>
       <description>
          The server invokes this to send messages to the clients.
          Does nothing if the client does not exist or the server does not
          have an open online game.
       </description>

       <param name="clientID" type="String">ID of a connected client, "*" to send to 
          all clients, or <code>"* - " + clientID</code> to send to
          all except the appended clientID.</param>
       <param name="messageType" type="String">Application-defined message type</param>
       <param name="messageBody" type="any">Any object.  This will be serialized to JSON, so references
         will be flattened automatically.</param>

       <see><api>onReceiveFromServer</api>, <api>onReceiveFromClient</api>, <api>sendToServer</api></see>
    </function>
*/
function sendToClient(clientID, messageType, messageBody) {
    _ch_checkArgs(3, 'sendToClient(clientID, messageType, messageBody)');

    if (_ch_isLocalClientID(clientID)) {
        setTimeout(function() {
            // We have to explicitly clone the message through
            // JSON to ensure that the local client has the same
            // semantics as a remote client.
            _ch_clientProcess_message
            ({ type: messageType, 
               data: JSON.parse(JSON.stringify(messageBody))
             });}, 0);
    }

    if (_ch_socket) {
        _ch_socket.emit('message', {clientID: clientID, type: messageType, data: messageBody});
    }
}


/** <function name="kickClient" level="advanced" category="online">
       <require>online</require>
       <description>
          The server invokes this to explicitly remove one or more clients from the game.
          Does nothing if the server does not have an open online game or
          the client is not in it.
       </description>

       <param name="clientID" type="String">ID of a connected client, "*" to kick to 
          all clients, or <code>"* - " + clientID</code> to kick to
          all except the appended clientID.</param>
       <param name="explanation" type="String">Application-defined message type</param>

       <see><api>onLeaveNetworkGame</api>, <api>onClientJoin</api>, <api>onClientLeave</api></see>
    </function>
*/
function kickClient(clientID, explanation) {
    _ch_checkArgs(2, 'kickClient(clientID, explanation)');

    if (_ch_isLocalClientID(clientID)) {
        setTimeout(function () {
            _ch_clientProcess_kickClient({explanation: explanation});
            _ch_clientProcess_disconnect();
        });
    } 

    if (_ch_socket) {
        _ch_socket.emit('kickClient', {clientID: clientID, explanation: explanation});
    }
}


/** <function name="closeOnlineGame" level="advanced" category="online">
       <require>online</require>
       <description>
          The server invokes this method to end the online game immediately.
       </description>
       <see><api>openOnlineGame</api>, <api>leaveOnlineGame</api>, <api>joinOnlineGame</api></see>
    </function>
*/
function closeOnlineGame() {
    _ch_checkArgs(0, 'closeOnlineGame()');

    if (_ch_client.isLocal) {
        // If I have a local client, disconnect that client
        // before shutting down the connection to the relay
        _ch_log(_ch_serverLog, 'Disconnecting local client...');
        setTimeout(function () {
            _ch_clientProcess_closeOnlineGame();
            _ch_clientProcess_disconnect();
            _ch_log(_ch_serverLog, 'Disconnected local client.');
        });
    }

    if (_ch_socket) {
        // Real network
        _ch_log(_ch_serverLog, 'Disconnecting from relay...');

        // Tell the relay (and thus the clients)
        _ch_socket.emit('closeOnlineGame');
        
        // Close the socket
        _ch_socket.disconnect();
    } else {
        _ch_log(_ch_serverLog, 'Closing virtual relay connection...');
        // Virtual network
        setTimeout(function() {
            _ch_serverProcess_disconnect();
            _ch_log(_ch_serverLog, 'Closed virtual relay connection.');
        });
    }
}


/** <function name="onOpenOnlineGame" level="advanced" category="online">
       <require>online</require>

       <description>
          This event occurs on the server when a call to <api>openOnlineGame</api> results in successfully 
          opening the game to online players.
        <p>
         Because network connections can be unreliable, especially on mobile devices,
         it is a good idea to structure your program so that the game can be
         opened and closed multiple times within a single session.  Likewise,
         it is a good idea to assume that the same clients will connect and
         disconnect during gameplay.
        </p>
       </description>

       <see><api>onCloseOnlineGame</api>, <api>onOnlineGameDisrupted</api>, <api>onOnlineGameRestored</api></see>
    </function>
*/

/** <function name="onClientLeave" level="advanced" category="online">
       <require>online</require>
       <description>This event occurs on the server when a client leaves or loses connection..
       </description>
       <param name="clientID" type="String">The unique ID that this client provided.  The same client may disconnect and then reconnect without changing ID, so this allows tracking clients persistently.</param>
    </function>
 */

/** <function name="onClientJoin" level="advanced" category="online">
       <require>online</require>
       <description>This event occurs on the server when a client joins.
       </description>
       <param name="clientID" type="String">The unique ID that this client provided.  The same client may disconnect and then reconnect without changing ID, so this allows tracking clients persistently.</param>
    </function>
 */

/** <function name="onCloseOnlineGame" level="advanced" category="online">
       <require>online</require>
       <description>
          This event occurs on the server when a call to <api>closeOnlineGame</api> results in successfully destroying the game.
       </description>

       <param name="reason" type="String">
       The reason that the game was destroyed:
       <ul>
          <li><code>"closeOnlineGame"</code>: The server invoked <api>closeOnlineGame</api>.</li>
          <li><code>"disrupted"</code>: The network connection was lost and the system was unable to restore it.</li>
       </ul>
       </param>

       <see><api>onOpenOnlineGame</api>, <api>closeOnlineGame</api></see>
    </function>
*/


/** <function name="onOpenOnlineGameFail" level="advanced" category="online">
       <require>online</require>
       <description>
          This event occurs on the server when a call to <api>openOnlineGame</api> 
          fails to connect to the relay, or the relay already has a server registered
          with the same name.
       </description>

       <param name="reason" type="String">
       The reason that opening the name failed:
       <ul>
          <li><code>"unreachable"</code>: The network connection to the relay could not be opened.</li>
          <li><code>"duplicate"</code>: There is already a server by this name on the relay.</li>
       </ul>
       </param>

       <see><api>onOpenOnlineGame</api>, <api>openOnlineGame</api></see>
    </function>
*/


/** <function name="onReceiveFromClient" level="advanced" category="online">
       <require>online</require>

       <description>
          This event occurs on the server when a message arrives.
       </description>

       <param name="clientID" type="String"></param>
       <param name="type" type="String"></param>
       <param name="data" type="any"></param>

       <see><api>onReceiveFromServer</api>, <api>onSendtoClient</api>, <api>onSendToServer</api></see>
    </function>
*/

////////////////////////////////////////////// Client Support ////////////////////////////////////////////


var _ch_client =
    {
        state:   _ch_ServerState.OFFLINE,

        clientID: '',

        // Only true if the client is local and connected
        isLocal: false,
        disconnectExplanation: ''
    };

/** <function name="onReceiveFromServer" level="advanced" category="online">
       <require>online</require>

       <description>
          This event occurs on the client when a message arrives.
       </description>

       <param name="type" type="String"></param>
       <param name="data" type="any"></param>

       <see><api>onReceiveFromClient</api>, <api>onSendtoClient</api>, 
          <api>onSendToServer</api></see>
    </function>
*/

/** <function name="onJoinOnlineGame" level="advanced" category="online">
       <require>online</require>

       <description>
          This event occurs on the client when a call to <api>joinOnlineGame</api> 
          results in successfully joining the game.
       </description>

       <see><api>joinOnlineGame</api>, <api>onLeaveOnlineGame</api>
       </see>
    </function>
*/

/** <function name="onReceiveServerList" level="advanced" category="online">
       <require>online</require>

       <description>
          This event occurs on the client when a call to <api>requestServerList</api> 
          prompts the return of information from the relay.
       </description>

       <param name="serverList" type="Array">
         Each element of the list is an object that is a server advertisement.
	 It contains at least a field <code>serverName</code> that is the name
	 of a server currently operating on the relay.  If the client was unable
	 to connect to the relay, then <code>serverList</code> will be an empty array.
       </param>

       <see><api>joinOnlineGame</api>, <api>requestServerList</api>
       </see>
    </function>
*/

/** <function name="onJoinOnlineGameFail" level="advanced" category="online">
       <require>online</require>
       <description>
          This event occurs on the client when a call to <api>openOnlineGame</api> 
          fails to connect to the relay.
       </description>

       <param name="reason" type="String">
       The reason that joining the game failed:
       <ul>
          <li><code>"unreachable"</code>: The network connection to the relay could not be opened.</li>
          <li><code>"no server"</code>: There is no server by this name at the relay.</li>
          <li><code>"duplicate"</code>: There is already a client with this id at the server.</li>
       </ul>
       </param>

       <see><api>onJoinOnlineGame</api>, <api>joinOnlineGame</api></see>
    </function>
*/

/** <function name="onLeaveOnlineGame" level="advanced" category="online">
       <require>online</require>
       <description>
          This event occurs on the client when disconnected from the game.
       </description>

       <param name="reason" type="String">
       The reason that the client left the game:
       <ul>
          <li><code>"closeOnlineGame"</code>:   The server invoked <api>closeOnlineGame</api>.</li>
          <li><code>"leaveOnlineGame"</code>: The client invoked <api>leaveOnlineGame</api>.</li>
          <li><code>"kickClient"</code>:      The server invoked <api>kickClient</api>.</li>
          <li><code>"disrupted"</code>:       The network connection was disrupted and could not be restored.</li>
       </ul>
       </param>

       <param name="explanation" type="String">
         If kicked, the explanation contains more information about why the client 
         was kicked that is suitable for showing to the player.
       </param>

       <see><api>leaveOnlineGame</api>,
            <api>onJoinOnlineGame</api> 
       </see>
    </function>
*/

/** True if this ID specified contains the local client */
function _ch_isLocalClientID(clientID) {
    return (_ch_client.isLocal && 
            ((clientID === _ch_client.clientID) || 
             (clientID === '*') ||
             ((clientID.substring(0, 4) === '* - ') &&
              (clientID.substring(4) !== _ch_client.clientID))));
}


/** <function name="requestServerList" level="advanced" category="online">

       <require>online</require>

       <description>
         Call to generate a list of all available online games. This 
	 can be called on the server or the client (client is the common
	 case), and may be called independently of whether the client
	 is in a game or the server is hosting.

         <center><a href="examples/onlinetest/online-guide.png"><img src="examples/onlinetest/online-guide.png" height="200"/></a></center>
       </description>

       <param name="relayURL" type="String"></param>
       <param name="gameName" type="String"></param>

       <see>
         <api>onReceiveServerList</api>
       </see>

    </function>
*/
function requestServerList(relayURL, gameName) {
    _ch_checkArgs(arguments, 2, 'requestServerList(relayURL, gameName)');
    _ch_log(_ch_clientLog, 'Connecting to relay ' + relayURL + ' to request server list');

    if (relayURL === '') {
	// Virtual network; only our own server could be on it

	// Schedule the callback 
	setTimeout(function () {
	    if ((_ch_server.state === _ch_ServerState.ONLINE) &&
		(relayURL === _ch_server.relayURL) &&
		(gameName === _ch_server.gameName)) {

		if (typeof onReceiveServerList === 'function') {
		    _ch_safeApply(onReceiveServerList, [{serverName: _ch_server.serverName}]);
		}
	    } else {
		if (typeof onReceiveServerList === 'function') {
		    _ch_safeApply(onReceiveServerList, []);
		}
	    }
	}, 0);
	return;
    }

    // This is a bit heavy-handed workaround to a Socket.IO known bug
    // where the 2nd network connection fails.  It would be better
    // to clear out state for individual sockets at disconnect time.
    _ch_resetSocketIO();
    var slSocket = codeheart.io.connect(relayURL, _ch_SOCKET_OPTIONS);

    var gotList = false;

    slSocket.on('connect', function() {
        _ch_log(_ch_clientLog, 'Connected to relay to request server list.');
        slSocket.emit('requestServerList', {gameName: gameName});

	slSocket.on('onReceiveServerList', function(msg) {
	    gotList = true;
            _ch_log(_ch_clientLog, 'Received list of ' + msg.serverList.length + ' servers.');
	    if (typeof onReceiveServerList === 'function') {
		_ch_safeApply(onReceiveServerList, msg.serverList);
	    }

	    // The relay will also disconnect
	    slSocket.disconnect();
	});

    });


    function failure() {
	if (! gotList) {
	    // The relay disconnected without sending our sever list. 
	    // Return the empty list to the user.
            _ch_log(_ch_clientLog, 'Failed to connect to relay while requesting server list.');
	    if (typeof onReceiveServerList === 'function') {
		_ch_safeApply(onReceiveServerList, []);
	    }
	} else {
            _ch_log(_ch_clientLog, 'Disconnected from relay after receiving server list.');
	}
    }

    slSocket.on('disconnect', failure);
    slSocket.on('error', failure);
    slSocket.on('connect_failed', failure);

}


/** <function name="joinOnlineGame" level="advanced" category="online">

       <require>online</require>

       <description>
         Call on the client to join an existing server.
       </description>

       <param name="relayURL" type="String">
       </param>
       
       <param name="gameName" type="String">
       </param>

       <param name="serverName" type="String">
       </param>

       <param name="clientID" type="String">
         <p>
           A unique identifier for this client.  It may not begin with an underscore.
           The server will refuse to accept the connection if another client with
           the same ID is already connected to it.  This could
           simply be the player's name.  The <api>generateUniqueID</api> function generates
           long unique IDs if the clientID is not intended to be human readable.
         </p>

         <p>In the event of a network 
         disruption, using the same ID to reconnect guarantees that the
         server knows which client it is communicating with.  
         </p>
       </param>

       <see>
         <api>onJoinOnlineGame</api>, <api>openOnlineGame</api>, 
         <api>closeOnlineGame</api>, <api>leaveOnlineGame</api>
       </see>

    </function>
*/
function joinOnlineGame(relayURL, gameName, serverName, clientID) {
    _ch_checkArgs(arguments, 3, 'joinOnlineGame(relayURL, gameName, ServerName)');
    _ch_checkID(clientID);

    if (_ch_client.state !== _ch_ServerState.OFFLINE) {
        _ch_error('Cannot join online game while already connected.');
    }

    _ch_clientTable = {};
    _ch_resetSocketIO();
    _ch_client.clientID = clientID;

    // Check to see if this should be a local client
    _ch_client.isLocal = ((_ch_server.state !== _ch_ServerState.OFFLINE) &&
                         (_ch_server.relayURL === relayURL) &&
                         (_ch_server.gameName === gameName) &&
                         (_ch_server.serverName === serverName));
    
    _ch_client.state = _ch_ServerState.CONNECTING;

    if (_ch_client.isLocal) {

        // Trigger the appropriate events on the client and server after a delay
        if (_ch_server.clientTable[clientID]) {

            // This client ID already exists.  Notify the client.
            setTimeout(function () { 
                _ch_log(_ch_clientLog, 'Failed to connect as a local client because another client already exists with this ID');
                _ch_clientProcess_onJoinOnlineGameFail({reason: 'duplicate'});
            }, 0);

        } else {
            // This is a new clientID.  
            
            setTimeout(function () {
                _ch_log(_ch_clientLog, 'Connected as local client');
                _ch_log(_ch_serverLog, 'A local client connected');
                _ch_server.clientTable[clientID] = {isLocal: true};

                // Tell the server that this client is present.
                if (typeof onClientJoin === 'function') {
                    _ch_safeApply(onClientJoin, clientID);
                }
                
                // Tell the client that it succeeded in connecting
                _ch_clientProcess_onJoinOnlineGame();
            }, 0);
        }

        return;
    }

    if (_ch_socket !== null) {
        _ch_error('Cannot connect to a different game as a client while hosting one as a server.');
    }

    _ch_log(_ch_clientLog, 'Connecting to relay at ' + relayURL + '...'); 
    _ch_socket = codeheart.io.connect(relayURL, _ch_SOCKET_OPTIONS);

    _ch_socket.on('connect', function() {
        _ch_log(_ch_clientLog, 'Connected to relay.');
        _ch_socket.emit('joinOnlineGame', {gameName: gameName, serverName: serverName, clientID: clientID});
    });


    // Errors can't happen to local clients, so this is not abstracted separately
    _ch_socket.on('error', function () {
        if (_ch_client.state === _ch_ServerState.CONNECTING) {
            _ch_log(_ch_clientLog, 'Connect failed because unreachable');
            // Unable to reach the relay
            _ch_client.state = _ch_ServerState.OFFLINE;

            if (typeof onJoinOnlineGameFail === 'function') {
                _ch_safeApply(onJoinOnlineGameFail, 'unreachable');
            }
        }
    });

    _ch_socket.on('onJoinOnlineGame',     _ch_clientProcess_onJoinOnlineGame);
    _ch_socket.on('onJoinOnlineGameFail', _ch_clientProcess_onJoinOnlineGameFail);
    _ch_socket.on('kickClient',           _ch_clientProcess_kickClient);
    _ch_socket.on('closeOnlineGame',      _ch_clientProcess_closeOnlineGame);
    _ch_socket.on('disconnect',           _ch_clientProcess_disconnect);
    _ch_socket.on('message',              _ch_clientProcess_message);
}


function _ch_clientProcess_onJoinOnlineGameFail(msg) {
    _ch_log(_ch_clientLog, 'Connect failed because ' + msg.reason);

    // The server or relay has rejected us
    _ch_client.state = _ch_ServerState.OFFLINE;
    
    if (typeof onJoinOnlineGameFail === 'function') {
        _ch_safeApply(onJoinOnlineGameFail, msg.reason);
    }
}


function _ch_clientProcess_onJoinOnlineGame() {
    // The server has accepted us
    _ch_client.state = _ch_ServerState.ONLINE;
    
    if (typeof onJoinOnlineGame === 'function') {
        _ch_safeApply(onJoinOnlineGame);
    }
}


// The server shut down the game
function _ch_clientProcess_closeOnlineGame() {
    _ch_log(_ch_clientLog, 'Received closeOnlineGame message.');
    _ch_client.state = _ch_ServerState.SERVER_DISCONNECTING;
}


/** Receive a message from the server */
function _ch_clientProcess_message(msg) {
    _ch_log(_ch_clientLog, 'Server: ' + msg.data);
    if (typeof onReceiveFromServer === 'function') {
        _ch_safeApply(onReceiveFromServer, msg.type, msg.data);
    }
}


/** The server is about to kick this client */
function _ch_clientProcess_kickClient(msg) {
    _ch_checkArgs(0, '_ch_clientProcess_kickClient()');
    _ch_log(_ch_clientLog, 'Received kickClient message.');
    _ch_client.state = _ch_ServerState.BEING_KICKED;
    _ch_client.disconnectExplanation = msg.explanation;
}


/** The socket was closed or connection was lost to the relay */
function _ch_clientProcess_disconnect() {
    _ch_checkArgs(0, '_ch_clientProcess_disconnect()');
    _ch_log(_ch_clientLog, 'Disconnected from server.');

    // If there was a disconnect while connecting, it was handled
    // by onJoinOnlineGameFail
    if (_ch_client.state === _ch_ServerState.CONNECTING) {
        
        // Try reconnecting if the problem was that the server
        // doesn't exist or the relay was unreachable
        
    } else {
        
        var reason = '';
        if (_ch_client.state === _ch_ServerState.BEING_KICKED) {
            reason = 'kickClient';
        } else if (_ch_client.state === _ch_ServerState.SERVER_DISCONNECTING) {
            reason = 'closeOnlineGame';
        } else if (_ch_client.state === _ch_ServerState.CLIENT_DISCONNECTING) {
            reason = 'leaveOnlineGame';
        } else if (_ch_client.state === _ch_ServerState.ONLINE) {
            reason = 'disrupted';
        }
        
        if (typeof onLeaveOnlineGame === 'function') {
            _ch_safeApply(onLeaveOnlineGame, reason, _ch_client.disconnectExplanation);
        }
    }
    
    _ch_client.state = _ch_ServerState.OFFLINE;
    _ch_client.isLocal = false;
    _ch_client.disconnectExplanation = '';
}

/** <function name="sendToServer" level="advanced" category="online">
       <require>online</require>
       <description>
          The client invokes this to send a message to the server.  Does nothing if not currently in
          an online game.
       </description>
       <param name="messageType" type="String">Application-defined message type</param>
       <param name="messageBody" type="any">Any object.  This will be serialized to JSON, so references will be flattened automatically.</param>
       <see><api>onReceiveFromServer</api>, <api>onReceiveFromClient</api>, <api>sendToClient</api></see>
    </function>
*/
function sendToServer(messageType, messageBody) {
    _ch_checkArgs(2, 'sendToServer(messageType, messageBody)');

    if (_ch_client.isLocal) {
        setTimeout(function() {
            _ch_serverProcess_message({
                clientID: _ch_client.clientID, 
                type: messageType,
                data: JSON.parse(JSON.stringify(messageBody))
                });
        }, 0);
    } else if (_ch_socket) {
        _ch_socket.emit('message', {type: messageType, data: messageBody});
    }
}


/** <function name="leaveOnlineGame" level="advanced" category="online">
       <require>online</require>

       <description>
         Call on the client to disconnect from the server immediately.
       </description>

       <see><api>onLeaveOnlineGame</api>, <api>openOnlineGame</api>, 
            <api>closeOnlineGame</api>, <api>joinOnlineGame</api>
       </see>
    </function>
*/
function leaveOnlineGame() {
    _ch_checkArgs(0, 'leaveOnlineGame()');

    _ch_client.state = _ch_ServerState.CLIENT_DISCONNECTING;

    if (_ch_client.isLocal) {
        _ch_log(_ch_clientLog, 'Disconnecting from local server...');
        setTimeout(function () {
            _ch_serverProcess_leaveOnlineGame({clientID: _ch_client.clientID});
            _ch_clientProcess_disconnect();
        }, 0);
    } else {
        _ch_log(_ch_clientLog, 'Disconnecting from remote server...');
        // No need to tell the server that we're leaving; it doesn't
        // care why we left.
        _ch_socket.disconnect();
    }
}

// Code in the following function Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.2.0-rc1
//
// Modified by Morgan McGuire for performance and integration into
// codeheart.js

/** 
    <function name="compress" level="advanced" category="datastructure">
    <description>
    Compresses long strings to reduce their size and then applies
    standard base-64 encoding so that the result is legal to embed
    within UTF-8 documents or transmit in e-mail.  The result will
    likely be larger than the input for very short or already
    compressed strings, but long strings will likely yield 2x-10x
    space reductions.
    </description>
    <param name="input" type="String"></param>
    <see><api>decompress</api></see>
  </function>
 */
/**
   <function name="decompress" level="advanced" category="datastructure">
   <description>Decompresses a string previously compressed with <api>compress</api>.</description>
   <param name="input" type="String"></param>
   <see><api>compress</api></see>
   </function>
*/

(function() {
  
  // private property
  var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  
  function compressToBase64(input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    
    input = compress(input);
    
    // base64 encoding
    while (i < input.length * 2) {
      
      if (i & 1) {
        chr1 = input.charCodeAt((i - 1) >> 1) & 255;
        if (((i + 1) >> 1) < input.length) {
          chr2 = input.charCodeAt((i + 1) >> 1) >> 8;
          chr3 = input.charCodeAt((i + 1) >> 1) & 255;
        } else {
          chr2 = chr3 = NaN;
        }
      } else {
        chr1 = input.charCodeAt(i >> 1) >> 8;
        chr2 = input.charCodeAt(i >> 1) & 255;
        if ((i >> 1) + 1 < input.length) {
          chr3 = input.charCodeAt((i >> 1)+1) >> 8;
        } else {
          chr3 = NaN;
        }
      }
      i+=3;
      
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      
      output +=
        _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
          _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
    }
    
    return output;
  }
  

  function decompressFromBase64(input) {
    var output = "",
        ol = 0, 
        output_,
        chr1, chr2, chr3,
        enc1, enc2, enc3, enc4,
        i = 0;
    
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    
    while (i < input.length) {
      
      enc1 = _keyStr.indexOf(input.charAt(i++));
      enc2 = _keyStr.indexOf(input.charAt(i++));
      enc3 = _keyStr.indexOf(input.charAt(i++));
      enc4 = _keyStr.indexOf(input.charAt(i++));
      
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      
      if (ol & 1) {
        output = output + String.fromCharCode(output_ | chr1);
        if (enc3 != 64) {
          output_ = chr2 << 8;
          flush = true;
        } else {
            flush = false;
        }

        if (enc4 != 64) {
          output += String.fromCharCode(output_ | chr3);
          flush = false;
        }
      } else {
        output_ = chr1 << 8;
        
        if (enc3 != 64) {
            output += String.fromCharCode(output_ | chr2);
            flush = false;
        } else {
            flush = true;
        }

        if (enc4 != 64) {
          output_ = chr3 << 8;
          flush = true;
        }
      }
      ol += 3;
    }
    
    return decompress(output);
  }

  
  function compress(uncompressed) {
    var i, value,
        context_dictionary= {},
        context_dictionaryToCreate= {},
        context_c="",
        context_wc="",
        context_w="",
        context_enlargeIn= 2, // Compensate for the first entry which should not count
        context_dictSize= 3,
        context_numBits= 2,
        context_result= "",
        context_data_string="", 
        context_data_val=0, 
        context_data_position=0,
        ii;
    
    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!context_dictionary.hasOwnProperty(context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }
      
      context_wc = context_w + context_c;
      if (context_dictionary.hasOwnProperty(context_wc)) {
        context_w = context_wc;
      } else {
        if (context_dictionaryToCreate.hasOwnProperty(context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position === 15) {
                context_data_position = 0;
                context_data_string += String.fromCharCode(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position === 15) {
                context_data_position = 0;
                context_data_string += String.fromCharCode(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position === 15) {
                context_data_position = 0;
                context_data_string += String.fromCharCode(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position === 15) {
                context_data_position = 0;
                context_data_string += String.fromCharCode(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn === 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data_string += String.fromCharCode(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
          
          
        }
        context_enlargeIn--;
        if (context_enlargeIn === 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }
    
    // Output the code for w.
    if (context_w !== "") {
      if (context_dictionaryToCreate.hasOwnProperty(context_w)) {
        if (context_w.charCodeAt(0)<256) {
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data_string += String.fromCharCode(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<8 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data_string += String.fromCharCode(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data_string += String.fromCharCode(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<16 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data_string += String.fromCharCode(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn === 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position === 15) {
            context_data_position = 0;
            context_data_string += String.fromCharCode(context_data_val);
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
        
        
      }

      --context_enlargeIn;
      if (context_enlargeIn === 0) {
        context_enlargeIn = (1 << context_numBits);
        ++context_numBits;
      }
    }
    
    // Mark the end of the stream
    value = 2;
    for (i = 0; i < context_numBits; ++i) {
      context_data_val = (context_data_val << 1) | (value&1);
      if (context_data_position === 15) {
        context_data_position = 0;
        context_data_string += String.fromCharCode(context_data_val);
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }
    
    // Flush the last char
    while (true) {
      context_data_val <<= 1;
      if (context_data_position === 15) {
        context_data_string += String.fromCharCode(context_data_val);
        break;
      } else {
          ++context_data_position;
      }
    }

    return context_data_string;
  }
  

  function decompress(compressed) {
    var dictionary = [],
        next,
        enlargeIn = 4,
        dictSize = 4,
        numBits = 3,
        entry = "",
        result = "",
        i,
        w,
        bits, resb, maxpower, power,
        c,
        errorCount=0,
        literal,
        data = {string:compressed, val:compressed.charCodeAt(0), position:32768, index:1};
    
    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i;
    }
    
    bits = 0;
    maxpower = 4;
    power = 1;
    while (power!=maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position === 0) {
        data.position = 32768;
        data.val = data.string.charCodeAt(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    next = bits;
    switch (next) {
      case 0: 
          bits = 0;
          maxpower = 1 << 8;
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= ((resb > 0) ? 1 : 0) * power;
            power <<= 1;
          }
        c = String.fromCharCode(bits);
        break;

      case 1: 
          bits = 0;
          maxpower = 1 << 16;
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = String.fromCharCode(bits);
        break;
      case 2: 
        return "";
    }

    dictionary[3] = c;
    w = result = c;
    while (true) {
      bits = 0;
      maxpower = Math.pow(2,numBits);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = 32768;
          data.val = data.string.charCodeAt(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

        c = bits;
      switch (c) {
        case 0: 
          if (errorCount++ > 10000) return "Error";
          bits = 0;
          maxpower = 1 << 8;
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = String.fromCharCode(bits);
          c = dictSize-1;
          --enlargeIn;
          break;

        case 1: 
          bits = 0;
          maxpower = 1 << 16;
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = String.fromCharCode(bits);
          c = dictSize-1;
          --enlargeIn;
          break;
        case 2: 
          return result;
      }
      
      if (enlargeIn === 0) {
        enlargeIn = 1 << numBits;
          ++numBits;
      }
      
      if (dictionary[c]) {
        entry = dictionary[c];
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result += entry;
      
      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0);
      --enlargeIn;
      
      w = entry;
      
      if (enlargeIn === 0) {
        enlargeIn = 1 << numBits;
          ++numBits;
      }
      
    }
    return result;
  }

   defineGlobals({compress: compressToBase64, decompress: decompressFromBase64});
})();

/** <variable name="isMobile" type="Boolean" category="interaction" level="advanced">
    <description>
      True if this appears to be a "mobile" device. Mobile devices are assumed
      to have touch screens, and if they have low resolutions are assumed to be
      low performance.
    </description>
    </variable> */
var isMobile = _ch_isMobile;


if (! String.repeat) {
    // Add ES6 feature if missing
    String.prototype.repeat = function (n) {
        if (n > 0) {
            return Array(n + 1).join(this);
        } else {
            return "";
        }
    }
}

////////////////////////////////////////////////////////////////////
if (typeof _ch_PLAY_VERSION === 'undefined'){
    _ch_PLAY_VERSION = 1.0;
}

if (_ch_PLAY_VERSION < 1.63) {
    console.warn("You are using out of date version " + sprintf("%3.1f", _ch_PLAY_VERSION) + " of play.html.  " + 
                 "Please download the latest version of play.html from " +
                 "http://codeheartjs.com or put the old version of " +
                 "codeheart.js in your directory to prevent this message.");
}


var codeheart =
    Object.freeze({
        VERSION : "2015-04-26 11:40",
        round : round,
        canvas : canvas,
        include : include,
        error : _ch_error,
        download : download,
        drawLogo : drawCodeheartLogo,
        fillRectangle: fillRectangle,
        strokeRectangle : strokeRectangle,
        fillCircle : fillCircle,
        strokeCircle : strokeCircle,
        fillSpline : fillSpline,
        strokeSpline : strokeSpline,
        drawImage : drawImage,
        drawTransformedImage : drawTransformedImage,
        isMobile : _ch_isMobile,
        isiOS : _ch_isiOS,
        vec2  : vec2,
        vec3  : vec3,
        playSound : playSound,
        stopSound : stopSound,
        loadSound : loadSound,
        playingSound : playingSound,
        loadImage : loadImage
    });
