
// Register Component Menu

Fire._componentMenuItems = [];

/**
 * Register a component to the "Component" menu.
 * 
 * @method Fire.addComponentMenu
 * @param {function} constructor - the class you want to register, must inherit from Component
 * @param {string} menuPath
 * @param {number} [order]
 */
Fire.addComponentMenu = function (constructor, menuPath, order) {
    Fire._componentMenuItems.push({
        component: constructor,
        menuPath: menuPath,
        order: order
    });
};
