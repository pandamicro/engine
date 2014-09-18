var Camera = (function () {

    var Camera = FIRE.define('FIRE.Camera', Component, function () {
        Component.call(this);

        this.renderContext = Engine._renderContext;
    });

    Camera.prop('_background', new FIRE.Color(0, 0, 0), FIRE.HideInInspector);
    Camera.getset('background',
        function () {
            return this._background;
        },
        function (value) {
            this._background = value;
            //
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
            var sx = tf._scale.x;
            var sy = tf._scale.y;

            var screenHeight = (this._renderContext || Engine._renderContext).size.y;
            var scale = this._size / screenHeight; // TODO, use half size?

            tf._scale.x = tf._scale.y = scale;

            var mat = tf.getWorldToLocalMatrix();

            tf._scale.x = sx;   // TODO: set dirty
            tf._scale.y = sy;
            
            return mat;
        }
    });

    // save the render context this camera belongs to, if null, main render context will be used.
    Object.defineProperty(Camera.prototype, 'renderContext', {
        set: function (value) {
            this._renderContext = value;
            this.size = value.size.y;
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
