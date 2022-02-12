import LispEnvironment from "./LispEnvironment";

export enum LispType {
  Symbol,
  Number,
  List,
  Proc,
  Lambda,
}

export const lisp_COMMON_LISP = "common_lisp";
export const lisp_SCHEME = "scheme";
export const lisp_dialect = lisp_SCHEME;
// var lisp_dialect = lisp_COMMON_LISP;

export default class LispCell {
  type: LispType;
  val: string;
  list: LispCell[];
  proc: Function;
  env: LispEnvironment;
  newLined: boolean;

  constructor(procOrType: LispType | Function, val?: string) {
    this.newLined = false;
    if (arguments.length > 1) {
      // new LispCell(type, val)
      this.type = procOrType as LispType;
      this.val = val;
    } else if (arguments.length > 0 && typeof arguments[0] === "function") {
      // new LispCell(proc)
      this.type = LispType.Proc;
      this.val = "";
      this.proc = procOrType as Function;
    } else if (arguments.length > 0) {
      // new LispCell(type)
      this.type = procOrType as LispType;
      this.val = "";
    } else {
      this.type = LispType.Symbol;
      this.val = "";
    }

    // std::vector<LispCell> list;
    this.list = [];
  }

  /**
   * Evaluates this cell using the given environment.
   */
  eval(env: LispEnvironment): LispCell {
    // Symbols represent lookups.
    if (this.type == LispType.Symbol) {
      return env.findVar(this.val).getVar(this.val);
    }

    // Literals represent themselves.
    if (this.type == LispType.Number) {
      return this;
    }

    if (this.list.length === 0) {
      return lisp_nil;
    }

    if (this.list[0].type == LispType.Symbol) {
      // (quote exp)
      if (this.list[0].val == "quote") {
        return this.list[1];
      }

      // (if test conseq [alt])
      if (this.list[0].val == "if") {
        if (this.list[1].eval(env) === lisp_false_sym) {
          if (this.list.length < 4) {
            return lisp_nil;
          }
          return this.list[3].eval(env);
        }
        return this.list[2].eval(env);
      }

      if (lisp_dialect === lisp_SCHEME) {
        // (set! var exp)
        if (this.list[0].val === "set!") {
          var localEnv = env.findVar(this.list[1].val);
          var result = this.list[2].eval(env);
          localEnv.setVar(this.list[1].val, result);
          return result;
        }

        // (define var exp)
        if (this.list[0].val === "define") {
          var result = this.list[2].eval(env);
          // console.log("Defining: " + this.list[1].val);
          env.setVar(this.list[1].val, result);
          return result;
        }

        // (begin exp*)
        if (this.list[0].val == "begin") {
          for (var i = 1; i < this.list.length - 1; ++i) {
            this.list[i].eval(env);
          }
          return this.list[this.list.length - 1].eval(env);
        }
      } else if (lisp_dialect === lisp_COMMON_LISP) {
        // (setq var exp)
        if (this.list[0].val === "setq") {
          var localEnv = env.findVar(this.list[1].val);
          localEnv.setVar(this.list[1].val, this.list[2].eval(env));
        }

        // (defvar var exp)
        if (this.list[0].val === "defvar") {
          if (!env.findVar(this.list[1].val)) {
            // Variable was not found, so set it.
            env.setVar(this.list[1].val, this.list[2].eval(env));
          }

          // Return the name of the defined variable.
          return this.list[1];
        }

        // (defun square (x)
        //   (* x x))
        if (this.list[0].val === "defun") {
          env.setProc(this.list[1].val, this.list[2].eval(env));

          // Return the name of the defined procedure.
          return this.list[1];
        }

        // (progn exp*)
        if (this.list[0].val == "progn") {
          for (var i = 1; i < this.list.length - 1; ++i) {
            this.list[i].eval(env);
          }
          return this.list[this.list.length - 1].eval(env);
        }
      }

      // (lambda (var*) exp)
      if (this.list[0].val == "lambda") {
        this.type = LispType.Lambda;
        // keep a reference to the environment that exists now (when the
        // lambda is being defined) because that's the outer environment
        // we'll need to use when the lambda is executed
        this.env = env;
        return this;
      }
    }

    // (proc exp*)
    const proc = env.findProc(this.list[0].val).getProc(this.list[0].val);
    if (!proc) {
      throw new Error("Proc must not be null");
    }
    const exps = [];

    for (var i = 1; i < this.list.length; ++i) {
      exps.push(this.list[i].eval(env));
    }
    if (proc.type == LispType.Lambda) {
      // Create an environment for the execution of this lambda function
      // where the outer environment is the one that existed* at the time
      // the lambda was defined and the new inner associations are the
      // parameter names with the given arguments.
      // *Although the environment existed at the time the lambda was defined
      // it wasn't necessarily complete - it may have subsequently had
      // more symbols defined in that environment.
      return proc.list[2].eval(
        new LispEnvironment(proc.env, proc.list[1].list, exps)
      );
    }
    if (proc.type == LispType.Proc) {
      return proc.proc.apply(proc, exps);
    }

    throw new Error("not a function\n");
  }

  /**
   * Converts the given cell to a Lisp-readable string.
   */
  toString(): string {
    if (this.type === LispType.List) {
      const children = [];
      for (let i = 0; i < this.list.length; ++i) {
        children.push(this.list[i].toString());
      }
      return "(" + children.join(" ") + ")";
    }
    if (this.type == LispType.Lambda) {
      return "<Lambda>";
    }
    if (this.type == LispType.Proc) {
      return "<Proc>";
    }
    return this.val;
  }
}

const lisp_nil = new LispCell(LispType.Symbol, "nil");
// const lisp_true_sym = new LispCell(LispType.Symbol, lisp_dialect === lisp_SCHEME ? "#t" : "T"); // anything that isn't false_sym is true
const lisp_false_sym =
  lisp_dialect === lisp_SCHEME ? new LispCell(LispType.Symbol, "#f") : lisp_nil;
