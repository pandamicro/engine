/**
 * show error stacks in editor
 * @method _throw
 * @param {Error} error
 * @private
 */
Fire._throw = function (error) {
    Fire.error(error.stack);
};
