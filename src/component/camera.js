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
    
    Object.defineProperty(Camera.prototype, 'worldToCameraMatrix', {
        get: function () {
            var tf = this.entity.transform;
            var px = tf._position.x;
            var py = tf._position.y;
            var sx = tf._scale.x;
            var sy = tf._scale.y;

            var screenSize = (this._renderContext || Engine._renderContext).size;
            var scale = this._size / screenSize.y; // TODO, use half size?

            tf._position.x = screenSize.x * -0.5;
            tf._position.y = screenSize.y * -0.5;
            tf._scale.x = tf._scale.y = scale;

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

    return Camera;
})();

FIRE.Camera = Camera;
