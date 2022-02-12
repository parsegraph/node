import LispCell, { lisp_dialect, lisp_SCHEME } from "./LispCell";

export default class LispEnvironment {
  _procedures: Map<string, LispCell>;
  _variables: Map<string, any>;
  _outer: LispEnvironment;

  constructor(outer: LispEnvironment, parms?: LispCell[], args?: LispCell[]) {
    this._procedures = new Map();
    this._variables = new Map();

    this._outer = outer;
    if (parms) {
      // new lisp_environment(parms, args, outer)
      // const lisp_cells& args
      for (let i = 0; i < parms.length; ++i) {
        const p = parms[i];
        this._variables.set(p.val, args[i]);
      }
    }
  }

  variables() {
    return this._variables;
  }

  procedures() {
    return this._procedures;
  }

  outerEnv() {
    return this._outer;
  }

  setVar(name: string, value: any): void {
    this._variables.set(name, value);
  }

  setProc(name: string, proc: LispCell) {
    if (lisp_dialect === lisp_SCHEME) {
      return this.setVar(name, proc);
    }
    this._procedures.set(name, proc);
  }

  /**
   * return a reference to the innermost environment where 'var' appears
   */
  findVar(varName: string): LispEnvironment {
    // check if the symbol exists in this environment
    if (varName in this._variables) {
      return this;
    }

    // attempt to find the symbol in some "outer" env
    if (this._outer) {
      // console.log("Deferring to outer environment for variable");
      return this._outer.findVar(varName);
    }

    throw new Error("unbound symbol '" + varName + "'");
  }

  getVar(varName: string): any {
    return this._variables.get(varName);
  }

  getProc(procName: string): LispCell {
    if (lisp_dialect === lisp_SCHEME) {
      // console.log("Deferring to var for procedure");
      return this.getVar(procName);
    }

    return this._procedures.get(procName);
  }

  /**
   * return a reference to the innermost environment where 'var' appears
   */
  findProc(procName: string): LispEnvironment {
    if (lisp_dialect === lisp_SCHEME) {
      // console.log("Deferring to var for procedure");
      return this.findVar(procName);
    }

    // check if the procedure exists in this environment
    const proc = this._procedures.get(procName);
    if (proc) {
      // console.log("Found procedure: " + proc);
      return this;
    }

    // attempt to find the procedure in some outer env
    if (this._outer) {
      // console.log("Deferring to outer environment for procedure");
      return this._outer.findProc(procName);
    }

    throw new Error("unbound procedure '" + procName);
  }
}
