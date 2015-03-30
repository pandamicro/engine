/**
 * !#en
 *
 * !#zh
 * ```
 * 本模块不含实际代码，仅仅为了声明本页面而定义。
 * ```
 *
 * 除了类已经定义的变量外，以下是其它 Fireball-x 中已经内部占用的变量名，请避免冲突。这些变量有一些只有特殊情况才会用到，有一些是将来可能会用到。
 *
 * ### 全局变量
 *
 * - `Fire`
 * - `Editor`
 * - `FireEditor`
 * - `PIXI`
 * - `require`
 *
 * ### 可能定义在任意对象上的变量
 *
 * - `__id__`
 * - `__type__`
 * - `_iN$t`
 * - `_rawext`
 *
 * ### 可能定义在任意类型或 prototype 上的变量
 *
 * - 任何以 `_attrs$` 开头的变量
 * - `__classname__`
 * - `__cid__`
 *
 * ### FireClass 上的静态变量
 *
 * - `get`
 * - `set`
 * - `getset`
 * - `prop`
 * - `$super`
 * - `__props__`
 *
 * ### FireClass 上的实例变量
 *
 * - `_observing`
 * - `_$erialized`
 *
 * ### 枚举定义上的变量
 *
 * - `__enums__`
 *
 *
 * @module Reserved-Words
 */

/**
 * @module Fire
 * @class Fire
 */

var Destroying = Fire._ObjectFlags.Destroying;
var DontDestroy = Fire._ObjectFlags.DontDestroy;
var Hide = Fire._ObjectFlags.Hide;
var HideInGame = Fire._ObjectFlags.HideInGame;
var HideInEditor = Fire._ObjectFlags.HideInEditor;


/**
 * !#zh 内容适配策略负责缩放摄像机画面以适应画布(Canvas)。
 * @class ContentStrategyType
 * @static
 */
var ContentStrategyType = Fire.defineEnum({

    /**
     * !#zh 不缩放内容，所有元素以原始大小显示在 Canvas 上。
     *
     * @property NoScale
     * @type number
     * @readOnly
     */
    NoScale: -1,

    ///**
    // * !#zh FixedWidth 模式会横向放大游戏世界以适应 Canvas 的宽度，纵向按原始宽高比放大。结果有可能导致放大（上下被裁剪），也有可能导致缩小（上下露出黑边）。
    // *
    // * @property FixedWidth
    // * @type number
    // * @readOnly
    // */
    //FixedWidth: -1,

    /**
     * !#en The application takes the height of the design resolution size and modifies the width of the internal canvas,
     * so that it fits the aspect ratio of the device and no distortion will occur,
     * however you must make sure your application works on different aspect ratios
     *
     * !#zh FixedHeight 模式会纵向放大游戏世界以适应 Canvas 的高度，横向按原始宽高比放大。结果有可能导致放大（左右被裁剪），也有可能导致缩小（左右露出黑边）。这是目前最推荐的适配方案。
     *
     * @property FixedHeight
     * @type number
     * @readOnly
     */
    FixedHeight: -1
});
Fire.ContentStrategyType = ContentStrategyType;
