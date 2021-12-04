import WindowNode from "../WindowNode";

export type ScheduleUpdateCallback = () => void;
export default abstract class TreeNode {
  _root: WindowNode;
  _needsUpdate: boolean;
  _onScheduleUpdate: ScheduleUpdateCallback;

  constructor() {
    this._needsUpdate = true;
    this._onScheduleUpdate = null;
    this._root = null;
  }

  abstract type(): Symbol;

  abstract render(): WindowNode;

  root(): WindowNode {
    if (this.needsUpdate()) {
      this._root = this.render();
      this._needsUpdate = false;
    }
    return this._root;
  }

  invalidate() {
    if (this.needsUpdate()) {
      return;
    }
    this._needsUpdate = true;
    if (this._onScheduleUpdate) {
      this._onScheduleUpdate();
    }
  }

  needsUpdate(): boolean {
    return this._needsUpdate;
  }

  setOnScheduleUpdate(callback: () => void): void {
    this._onScheduleUpdate = callback;
  }
}
