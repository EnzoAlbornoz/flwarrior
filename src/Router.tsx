// Import Dependencies
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Helmet } from "react-helmet";
// Import Routes
import HomePage from "./pages/Home";
import FiniteAutomataPage from "./pages/automata/finite";
import RegularGrammarsPage from "./pages/grammars/regular";
// Define Component
export default function Router(): JSX.Element {
    return (
        <>
            <BrowserRouter>
                <Switch>
                    <Route path="/" exact>
                        <Helmet title="Home - FL Warrior" />
                        <HomePage />
                    </Route>
                    {/* Automata */}
                    <Route path="/automata/finite" exact>
                        <Helmet title="Autômatos Finitos - FL Warrior" />
                        <FiniteAutomataPage />
                    </Route>
                    {/* Grammars */}
                    <Route path="/grammars/regular" exact>
                        <Helmet title="Gramáticas Regulares - FL Warrior" />
                        <RegularGrammarsPage />
                    </Route>
                    {/* Expressions */}
                    <Route path="/expressions/regular" exact>
                        <Helmet title="Expressões Regulares - FL Warrior" />
                        <HomePage />
                    </Route>
                </Switch>
            </BrowserRouter>
        </>
    );
}
