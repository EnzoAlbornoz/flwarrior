// Import Dependencies
import React from "react";
import ReactDOM from "react-dom";
// Import Styles
import "antd/dist/antd.css";
// Import Components
import App from "./App";
// Start Application
ReactDOM.render(React.createElement(App), document.getElementById("root"));
// Handle Webpack HMR
if (module.hot) {
    module.hot.accept();
}
