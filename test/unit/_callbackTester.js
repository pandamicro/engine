// jshint ignore: start

var CallbackTester = FIRE.simpleExtend(FIRE.Component, function () {
    this._expects = [];
    this._messages = [];
    this._unexpect = {};
});

CallbackTester.OnEnable = 'onEnable';
CallbackTester.OnDisable = 'onDisable';
CallbackTester.OnDestroy = 'onDestroy';

/**
 * @param {string} expect
 * @param {string} [message]
 * @param {boolean} [append=false]
 */
CallbackTester.prototype.expect = function (expect, message, append) {
    var error = !append && this._expects.length > 0;
    if (error) {
        strictEqual(this._expects[0].expect, null, 'expecting a new callback but the last ' + this._expects[0].expect + ' have not being called');
        this._expects.length = 0;
    }
    else {
        if (expect in this._unexpect) {
            ok(false, 'The expected callback is still unexpected, clear unexpect list. The last callback not called yet ?');
            this._unexpect = {};
        }
    }
    this._expects.push({
        expect: expect,
        message: message
    });
    return this;
};

/**
 * @param {string} notExpect
 * @param {string} [message]
 */
CallbackTester.prototype.notExpect = function (notExpect, message) {
    if (this._expects.length > 0 && this._expects[0].expect === notExpect) {
        ok(false, 'The callback not expected is still expected, the last callback not called yet ?');
        return;
    }
    this._unexpect[notExpect] = message;
    return this;
};

CallbackTester.prototype._assert = function (actual) {
    if (this._expects.length > 0) {
        var current = this._expects.splice(0, 1)[0];
        var expect = current.expect;
        var message = current.message;
    }
    if (expect !== actual) {
        var error = this._unexpect[actual];
        if (!error) {
            if (expect) {
                error = '' + expect + ' not called, actual: ' + actual;
            }
            else {
                error = 'not expect any callback but ' + actual + ' called';
            }
        }
    }
    strictEqual(actual, expect, error || message || '' + expect + ' called');
    this._unexpect = {};
    console.log('CallbackTester: ' + actual);
};

CallbackTester.prototype.onEnable = function () {
    this._assert(CallbackTester.OnEnable);
};

CallbackTester.prototype.onDisable = function () {
    this._assert(CallbackTester.OnDisable);
};

CallbackTester.prototype.onDestroy = function () {
    this._assert(CallbackTester.OnDestroy);
};

// jshint ignore: end
