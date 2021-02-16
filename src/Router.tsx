// Import Dependencies
import { BrowserRouter, Route, Switch } from "react-router-dom";
// Import Routes
import HomePage from "./pages/Home";
import FiniteAutomataPage from "./pages/automata/finite";
// Define Component
export default function Router(): JSX.Element {
    return (
        <>
            <BrowserRouter>
                <Switch>
                    <Route path="/" exact>
                        <HomePage />
                    </Route>
                    {/* Automata */}
                    <Route path="/automata/finite" exact>
                        <FiniteAutomataPage />
                    </Route>
                    {/* Grammars */}
                    <Route path="/grammars/regular" exact>
                        <HomePage />
                    </Route>
                    {/* Expressions */}
                    <Route path="/expressions/regular" exact>
                        <HomePage />
                    </Route>
                </Switch>
            </BrowserRouter>
        </>
    );
}
