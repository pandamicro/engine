/**
 * qunit-assert-callback
 * A QUnit assert plugin to test callback. You can easily assert that the callback can (only) be called at the correct moment.
 * 
 * Author: Jare https://github.com/jareguo/
 * Homepage: https://github.com/jareguo/qunit-assert-callback
 * Copyright (C) FireBox http://www.firebox.im/
 * Licensed under the MIT license.
 */

function callback(callbackFunction) {
    var enabled = false;

    var callbackName_ = 'Callback';
    var msgWhenDisabled_ = '';
    var callbackFunction_ = callbackFunction;

    var wrapper = function () {
        if (!enabled) {
            var message = callbackName_ + ' can be called only after enable()'
            QUnit.push(false, message, message, msgWhenDisabled_);
            return;
        }
        ++wrapper.calledCount;
        if (callbackFunction_) {
            callbackFunction_.apply(this, arguments);
        }
    };

    wrapper.calledCount = 0;

    // builder
    wrapper.setName = function (callbackName) {
        callbackName_ = callbackName;
        return wrapper;
    };
    wrapper.setDisabledMessage = function (msgWhenDisabled) {
        msgWhenDisabled_ = msgWhenDisabled;
        return wrapper;
    };
    wrapper.callbackFunction = function (callbackFunction) {
        callbackFunction_ = callbackFunction;
        return wrapper;
    };

    wrapper.enable = function () {
        enabled = true;
        return wrapper;
    };
    wrapper.disable = function (msgWhenDisabled) {
        enabled = false;
        msgWhenDisabled_ = msgWhenDisabled;
        return wrapper;
    };
    wrapper.expect = function (count, message) {
        var result = wrapper.calledCount == count;
        var message = message || callbackName_ + ' should be called ' + count + ' time(s)' + (result ? '' : '. Actual: ' + wrapper.calledCount);
        QUnit.push(result, wrapper.calledCount.toString() + ' time(s)', count + ' time(s)', message);
        return wrapper;
    };
    wrapper.once = function (message) {
        wrapper.expect(1, message);
        wrapper.calledCount = 0;
        return wrapper;
    };
    return wrapper;
}

QUnit.extend(QUnit.assert, {
    callback: callback
});

QUnit.extend(QUnit, {
    separator: function () {
        module('');
        test('----------------------------------------------------------------------------------------------------------------------------', 0, function () {});
    }
});

QUnit.extend(window, {
    separator: QUnit.separator
});
