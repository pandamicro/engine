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
            var screenSize = (this._renderContext || Engine._renderContext).size;
            var scale = this._size / screenSize.y;

            var tf = this.entity.transform;
            var mat = tf.getWorldToLocalMatrix();

            // dont calculate scaling for translation
            var scaledByParent = mat.getScale();
            mat.tx /= scaledByParent.x;
            mat.ty /= scaledByParent.y;
            // align to screen center
            mat.tx += screenSize.x * 0.5;
            mat.ty += screenSize.y * 0.5;
            // set scale
            mat.setScale(scale, scale);
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
     * Transforms position from screen space into viewport space.
     * @method FIRE.Camera#screenToViewport
     * @param {FIRE.Vec2} position
     * @param {FIRE.Vec2} [out] - optional, the receiving vector
     * @returns {FIRE.Vec2}
     */
    Camera.prototype.screenToViewport = function (position, out) {
        out = out || new Vec2();
        var size = this._renderContext.size;
        out.x = position.x / size.x;
        out.y = position.y / size.y;
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
        return vp.transformPoint(position, out);
    };

    return Camera;
})();

FIRE.Camera = Camera;
