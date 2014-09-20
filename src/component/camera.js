var Camera = (function () {

    var Camera = FIRE.define('FIRE.Camera', Component, function () {
        Component.call(this);

        this._renderContext = null;
        this.renderContext = Engine._renderContext;
    });

    Camera.prop('_background', new FIRE.Color(0, 0, 0), FIRE.HideInInspector);
    Camera.getset('background',
        function () {
            return this._background;
        },
        function (value) {
            this._background = value;
            if (this._renderContext) {
                this._renderContext.stage.setBackgroundColor(value.toRGBValue());
            }
        }
    );

    Camera.prop('_size', 5, FIRE.HideInInspector);
    Camera.getset('size',
        function () {
            return this._size;
        },
        function (value) {
            this._size = value;
        }
    );
    
    /**
     * @property {FIRE.Matrix3} Camera#vpMatrix - the view projection matrix
     */
    Object.defineProperty(Camera.prototype, 'vpMatrix', {
        get: function () {
            var tf = this.entity.transform;
            var px = tf._position.x;
            var py = tf._position.y;
            var sx = tf._scale.x;
            var sy = tf._scale.y;

            var screenSize = (this._renderContext || Engine._renderContext).size;
            var scale = this._size / screenSize.y; // TODO, use half size?

            tf._position.x = screenSize.x * scale * -0.5;
            tf._position.y = screenSize.y * scale * -0.5;
            tf._scale.x = scale;
            tf._scale.y = scale;

            var mat = tf.getWorldToLocalMatrix();

            tf._scale.x = sx;   // TODO: set dirty
            tf._scale.y = sy;
            tf._position.x = px;
            tf._position.y = py;

            return mat;
        }
    });

    // save the render context this camera belongs to, if null, main render context will be used.
    Object.defineProperty(Camera.prototype, 'renderContext', {
        set: function (value) {
            this._renderContext = value;
            this.size = value.size.y;
            // update render settings
            this.background = this._background;
        }
    });

    //// built-in functions
    //Camera.prototype.onLoad = function () {
    //};
    Camera.prototype.onEnable = function () {
        if (!(this.entity._objFlags & FIRE.ObjectFlags.SceneGizmo)) {
            Engine._scene.camera = this;
        }
    };
    //Camera.prototype.onPreRender = function () {
    //};
    //Camera.prototype.onDestroy = function () {
    //};

    // other functions

    /**
     * Transforms position from viewport space into screen space.
     * @method FIRE.Camera#viewportToScreen
     * @param {FIRE.Vec2} position
     * @param {FIRE.Vec2} [out] - optional, the receiving vector
     * @returns {FIRE.Vec2}
     */
    Camera.prototype.viewportToScreen = function (position, out) {
        out = this._renderContext.size.scale(position, out);
        return out;
    };

    /**
     * Transforms position from viewport space into world space.
     * @method FIRE.Camera#viewportToWorld
     * @param {FIRE.Vec2} position
     * @param {FIRE.Vec2} [out] - optional, the receiving vector
     * @returns {FIRE.Vec2}
     */
    Camera.prototype.viewportToWorld = function (position, out) {
        return this.screenToWorld(this.viewportToScreen(position, out), out);
    };

    /**
     * Transforms position from screen space into world space.
     * @method FIRE.Camera#screenToWorld
     * @param {FIRE.Vec2} position
     * @param {FIRE.Vec2} [out] - optional, the receiving vector
     * @returns {FIRE.Vec2}
     */
    Camera.prototype.screenToWorld = function (position, out) {
        var vp = this.vpMatrix;
        vp.invert();
        vp.transformPoint(position, out);
        return out;
    };

    return Camera;
})();

FIRE.Camera = Camera;
