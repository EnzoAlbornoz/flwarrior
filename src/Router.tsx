// Import Dependencies
import { BrowserRouter, Route, Switch } from "react-router-dom";
// Import Routes
import HomePage from "./pages/Home";
// Define Component
export default function Router(): JSX.Element {
    return (
        <>
            <BrowserRouter>
                <Switch>
                    <Route path="/" exact>
                        <HomePage />
                    </Route>
                </Switch>
            </BrowserRouter>
        </>
    );
}
