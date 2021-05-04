import Method from 'parsegraph-method';
import WindowNode from './WindowNode';

export default class CarouselAction {
  _action:WindowNode;
  _func:Method;
  _hotkey:string;
  _node:WindowNode;
  _nodeData:any;

  constructor(action:WindowNode, func:Function, thisArg?:any) {
    this._action = action;
    this._func = new Method(func, thisArg);
    this._hotkey = null;
    this._node = null;
    this._nodeData = null;
  }

  call() {
    this._func.call(this._nodeData);
  }

  setAction(action:WindowNode) {
    this._action = action;
  }
  
  action() {
    return this._action;
  }

  getCallback() {
    return this._func;
  }

  setNodeData(node:WindowNode, nodeData?:any) {
    this._node = node;
    this._nodeData = nodeData;
  }

  nodeData() {
    return this._nodeData;
  }

  node() {
    return this._node;
  }

  setHotkey(hotkey:string) {
    this._hotkey = hotkey;
  }

  hotkey() {
    return this._hotkey;
  }
}
