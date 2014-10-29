
// Register Component Menu

Fire._componentMenuItems = [];

/**
 * Register a component to the "Component" menu.
 * 
 * @method Fire.addComponentMenu
 * @param {function} constructor - the class you want to register, must inherit from Component
 * @param {string} menuPath - the menu path name. Eg. "Rendering/Camera"
 * @param {number} [priority] - the order which the menu item are displayed
 */
Fire.addComponentMenu = function (constructor, menuPath, priority) {
    Fire._componentMenuItems.push({
        component: constructor,
        menuPath: menuPath,
        order: priority
    });
};
