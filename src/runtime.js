var Runtime = {
    init: function () {
        //
    },
    render: function (renderContext) {
        Engine._scene.render(renderContext || Engine._renderContext);
    }
};

JS.getset(Runtime, 'RenderContext',
    function () {
        return RenderContext;
    },
    function (value) {
        RenderContext = value;
    }
);

Fire._Runtime = Runtime;
