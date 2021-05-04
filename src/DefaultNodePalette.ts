import {NodePalette} from 'parsegraph-direction';
import DefaultNodeType, {Type, readType} from './DefaultNodeType';
import Node from './Node';

export default class DefaultNodePalette extends NodePalette<Node<DefaultNodeType>> {
  _budType:DefaultNodeType;
  _blockType:DefaultNodeType;
  _slotType:DefaultNodeType;
  _sliderType:DefaultNodeType;
  _sceneType:DefaultNodeType;
  _mathMode:boolean;

  constructor(mathMode?:boolean) {
    super();
    this._mathMode = mathMode;
  }

  defaultType(): Node<DefaultNodeType> {
    return this.spawn();
  }

  spawn(given?:any): Node<DefaultNodeType> {
    if (given instanceof Node) {
      return given;
    }
    return new Node<DefaultNodeType>(this.readType(given));
  }

  replace(node:Node<DefaultNodeType>, type:any):void {
    node.setType(this.readType(type));
  }

  ensureTypes():void {
    if (this._budType) {
      return;
    }
    this._budType = new DefaultNodeType(this, Type.BUD);
    this._blockType = new DefaultNodeType(this, Type.BLOCK, this._mathMode);
    this._slotType = new DefaultNodeType(this, Type.SLOT, this._mathMode);
    this._sliderType = new DefaultNodeType(this, Type.SLIDER);
    this._sceneType = new DefaultNodeType(this, Type.SCENE);
  }

  readType(given?: any):DefaultNodeType {
    if (given && typeof given === 'object') {
      return given;
    }
    if (typeof given === 'string') {
      given = readType(given);
    }
    this.ensureTypes();
    switch (given) {
    case Type.BLOCK: return this._blockType;
    case Type.BUD: return this._budType;
    case Type.SLOT: return this._slotType;
    case Type.SCENE: return this._sceneType;
    case Type.SLIDER: return this._sliderType;
    }
    return this._budType;
  }
}
