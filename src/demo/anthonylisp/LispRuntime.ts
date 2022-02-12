/* // return given number as a string
{
    ////////////////////// built-in primitive procedures
    var proc_add = function() {
        var n = Number(arguments[0].val);
        for(var i = 1; i < arguments.length; ++i) {
            n += Number(arguments[i].val);
        }
        return new lisp_cell(lisp_Number, n);
    };

    var proc_sub = function() {
        var n = Number(arguments[0].val);
        for(var i = 1; i < arguments.length; ++i) {
            n -= Number(arguments[i].val);
        }
        return new lisp_cell(lisp_Number, n);
    };

    var proc_mul = function() {
        var n = 1;
        for(var i = 0; i < arguments.length; ++i) {
            n *= Number(arguments[i].val);
        }
        return new lisp_cell(lisp_Number, n);
    };

    var proc_div = function() {
        var n = Number(arguments[0].val);
        for(var i = 1; i < arguments.length; ++i) {
            n /= Number(arguments[i].val);
        }
        return new lisp_cell(lisp_Number, n);
    };

    var proc_greater = function() {
        var n = Number(arguments[0].val);
        for(var i = 1; i < arguments.length; ++i) {
            if(n <= Number(arguments[i].val)) {
                return lisp_false_sym;
            }
        }
        return lisp_true_sym;
    };

    var proc_greater_equal = function() {
        var n = Number(arguments[0].val);
        for(var i = 1; i < arguments.length; ++i) {
            if(n < Number(arguments[i].val)) {
                return lisp_false_sym;
            }
        }
        return lisp_true_sym;
    };

    var proc_less = function() {
        var n = Number(arguments[0].val);
        for(var i = 1; i < arguments.length; ++i) {
            if(n >= Number(arguments[i].val)) {
                return lisp_false_sym;
            }
        }
        return lisp_true_sym;
    };

    var proc_less_equal = function() {
        var n = Number(arguments[0].val);
        for(var i = 1; i < arguments.length; ++i) {
            if(n > Number(arguments[i].val)) {
                return lisp_false_sym;
            }
        }
        return lisp_true_sym;
    };

    var proc_length = function() {
        return new lisp_cell(lisp_Number, arguments[0].list.length);
    };

    var proc_nullp = function() {
        return arguments[0].list.length === 0 ? lisp_true_sym : lisp_false_sym;
    };

    var proc_car = function() {
        return arguments[0].list[0];
    };

    var proc_cdr = function() {
        if(arguments[0].list.length < 2) {
            return lisp_nil;
        }
        var result = new lisp_cell(arguments[0]);
        result.shift();
        return result;
    };

    var proc_append = function() {
        var result = new lisp_cell(lisp_List);
        result.list = arguments[0].list;
        arguments[1].forEach(function(i) {
            result.list.push(i);
        });
        return result;
    };

    var proc_cons = function() {
        var result = new lisp_cell(lisp_List);
        result.list.push(arguments[0]);
        arguments[1].forEach(function(i) {
            result.list.push(i);
        });
        return result;
    };

    var proc_list = function() {
        var result = new lisp_cell(lisp_List);
        result.list = [].slice.call(arguments);
        return result;
    };

    // define the bare minimum set of primintives necessary to pass the unit tests
    lisp_add_globals = function(env)
    {
        env.setVar("nil", lisp_nil);
        if(lisp_dialect === lisp_SCHEME) {
            env.setVar("#f", lisp_false_sym);
            env.setVar("#t", lisp_true_sym);
        }
        else if(lisp_dialect === lisp_COMMON_LISP) {
            env.setVar("T", lisp_true_sym);
        }

        env.setProc("append", new lisp_cell(proc_append));
        env.setProc("car", new lisp_cell(proc_car));
        env.setProc("cdr", new lisp_cell(proc_cdr));
        env.setProc("cons", new lisp_cell(proc_cons));
        env.setProc("length", new lisp_cell(proc_length));
        env.setProc("list", new lisp_cell(proc_list));
        if(lisp_dialect === lisp_SCHEME) {
            env.setProc("null?", new lisp_cell(proc_nullp));
        }
        else if(lisp_dialect === lisp_COMMON_LISP) {
            env.setProc("null", new lisp_cell(proc_nullp));
        }
        env.setProc("+", new lisp_cell(proc_add));
        env.setProc("-", new lisp_cell(proc_sub));
        env.setProc("*", new lisp_cell(proc_mul));
        env.setProc("/", new lisp_cell(proc_div));
        env.setProc(">", new lisp_cell(proc_greater));
        env.setProc("<", new lisp_cell(proc_less));
        env.setProc("<=", new lisp_cell(proc_less_equal));
        env.setProc(">=", new lisp_cell(proc_less_equal));
    };
}*/
