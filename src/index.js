var FIRE;
(function (FIRE) {
    var __TESTONLY__ = {};
    FIRE.__TESTONLY__ = __TESTONLY__;

    // jshint ignore: start
    <%=contents%>
    // jshint ignore: end

})(FIRE || (FIRE = {}));

if (typeof module !== "undefined" && module) {
    module.exports = FIRE;
}
else if (typeof define === "function" && define && define.amd) {
    define([], function() {
        return FIRE;
    });
}
