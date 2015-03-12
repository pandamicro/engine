
// @ifdef DEV
function checkCompCtor (constructor, scopeName) {
    if (constructor) {
        if (Fire.isChildClassOf(constructor, Component)) {
            Fire.error(scopeName + ' Constructor can not be another Component');
            return false;
        }
        if (constructor.length > 0) {
            // To make a unified FireClass serialization process,
            // we don't allow parameters for constructor when creating instances of FireClass.
            // For advance user, construct arguments can get from 'arguments'.
            Fire.error(scopeName + ' Can not instantiate Component with arguments.');
            return false;
        }
    }
    return true;
}
// @endif


var doDefine = Fire._doDefine;
Fire._doDefine = function (className, baseClass, constructor) {
    if ( Fire.isChildClassOf(baseClass, Fire.Component) ) {
        var frame = Fire._RFget();
        if (frame) {
// @ifdef DEV
            if ( !checkCompCtor(constructor, '[Fire.extend]') ) {
                return null;
            }
// @endif
            if (frame.uuid) {
                // project component
                if (className) {
                    Fire.warn('Sorry, specifying class name for Component in project scripts is not allowed. Just use Fire.extend(baseComponent, constructor) please.');
                }
            }
            //else {
            //    builtin plugin component
            //}
            className = className || frame.script;
            var cls = doDefine(className, baseClass, constructor);
            if (frame.uuid) {
                JS._setClassId(frame.uuid, cls);
            }
            return cls;
        }
    }
    // not component or engine component
    return doDefine(className, baseClass, constructor);
};
