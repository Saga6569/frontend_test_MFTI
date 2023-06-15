import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

if (process.env.NODE_ENV === "development") {
  import("./mocks/browser.js").then(({ worker }) => worker.start());
}

ReactDOM.render(<App />, document.getElementById("root"));
