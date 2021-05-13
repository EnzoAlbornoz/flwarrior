// Import Dependencies
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Helmet } from "react-helmet";
// Import Routes
import HomePage from "@pages/Home";
import FiniteAutomataPage from "@pages/automata/finite";
import FiniteAutomataEditPage from "@pages/automata/finite/edit";
import FiniteAutomataExecutePage from "@pages/automata/finite/execute";
import RegularGrammarsPage from "@pages/grammars/regular";
import RegularGrammarEditPage from "@pages/grammars/regular/edit";
import ContexFreeGrammarsPage from "@pages/grammars/contextFree";
import ContexFreeGrammarEditPage from "@pages/grammars/contextFree/edit";
import RegularExpressionsPage from "@pages/expressions/regular";
import RegularExpressionEditPage from "@pages/expressions/regular/edit";
import AnalysisLexicalPage from "@pages/analysis/lexical";
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
                    <Route path="/automata/finite/edit/:id" exact>
                        <Helmet title="Editar - Autômato Finito - FL Warrior" />
                        <FiniteAutomataEditPage />
                    </Route>
                    <Route path="/automata/finite/execute/:id" exact>
                        <Helmet title="Executar - Autômato Finito - FL Warrior" />
                        <FiniteAutomataExecutePage />
                    </Route>
                    {/* Grammars */}
                    <Route path="/grammars/regular" exact>
                        <Helmet title="Gramáticas Regulares - FL Warrior" />
                        <RegularGrammarsPage />
                    </Route>
                    <Route path="/grammars/regular/edit/:id" exact>
                        <Helmet title="Editar - Gramática Regular - FL Warrior" />
                        <RegularGrammarEditPage />
                    </Route>
                    <Route path="/grammars/context-free" exact>
                        <Helmet title="Gramáticas Livre de Contexto - FL Warrior" />
                        <ContexFreeGrammarsPage />
                    </Route>
                    <Route path="/grammars/context-free/edit/:id" exact>
                        <Helmet title="Editar - Gramática Livre de Contexto - FL Warrior" />
                        <ContexFreeGrammarEditPage />
                    </Route>
                    {/* Expressions */}
                    <Route path="/expressions/regular" exact>
                        <Helmet title="Expressões Regulares - FL Warrior" />
                        <RegularExpressionsPage />
                    </Route>
                    <Route path="/expressions/regular/edit/:id" exact>
                        <Helmet title="Editar - Expressão Regular - FL Warrior" />
                        <RegularExpressionEditPage />
                    </Route>
                    <Route path="/analysis/lexical" exact>
                        <Helmet title="Analisador Léxico - FL Warrior" />
                        <AnalysisLexicalPage />
                    </Route>
                </Switch>
            </BrowserRouter>
        </>
    );
}
