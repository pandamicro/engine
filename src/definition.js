var Destroying = Fire._ObjectFlags.Destroying;
var Hide = Fire._ObjectFlags.Hide;
var HideInGame = Fire._ObjectFlags.HideInGame;
var HideInEditor = Fire._ObjectFlags.HideInEditor;

/**
 * used in _callOnEnable to ensure onEnable and onDisable will be called alternately
 * 从逻辑上来说OnEnable和OnDisable的交替调用不需要由额外的变量进行保护，但那样会使设计变得复杂
 * 例如Entity.destory调用后但还未真正销毁时，会调用所有Component的OnDisable。
 * 这时如果又有addComponent，Entity需要对这些新来的Component特殊处理。将来调度器做了之后可以尝试去掉这个标记。
 */
var IsOnEnableCalled = Fire._ObjectFlags.IsOnEnableCalled;

var IsOnLoadCalled = Fire._ObjectFlags.IsOnLoadCalled;
var IsOnStartCalled = Fire._ObjectFlags.IsOnStartCalled;
