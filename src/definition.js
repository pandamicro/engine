/**
 * !#en
 *
 * !#zh 除了类已经定义的变量外，以下是其它 Fireball-x 中已经使用的变量名，请避免冲突。这些变量有一些是保留用途，只有特殊情况才会声明。
 * ### 全局变量
 * - `Fire`
 * - `PIXI`
 * - `require`
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
 * ### FireClass 上的成员变量
 *
 * - `_observing`
 * - `_$erialized`
 *
 * @module Reserved-Words
 */

var Destroying = Fire._ObjectFlags.Destroying;
var DontDestroy = Fire._ObjectFlags.DontDestroy;
var Hide = Fire._ObjectFlags.Hide;
var HideInGame = Fire._ObjectFlags.HideInGame;
var HideInEditor = Fire._ObjectFlags.HideInEditor;