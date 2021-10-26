import parse, { parseTokens, tokenize } from "./parse";
import LispCell, { LispType } from "./LispCell";
import LispEnvironment from "./LispEnvironment";
import LispAtom from "./LispAtom";

export default parse;
export { parseTokens, tokenize, LispCell, LispEnvironment, LispAtom, LispType };

/*

void lisp_repl(const std::string & prompt, lisp_environment * env)
{
    // Begin the REPL
    for(;;) {
        std::cout << prompt;
        std::string line;
        if(!std::getline(std::cin, line)) {
            std::cout << '\n';
            break;
        }
        console.log(lisp_eval(lisp_read(line), env));
    }
}

int main()
{
    // Create the initial environment.
    lisp_environment global_env;
    lisp_add_globals(global_env);

    lisp_repl("90> ", &global_env);

    return 0;
}
*/
