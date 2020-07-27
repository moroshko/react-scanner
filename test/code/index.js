import React from "react";
import ReactDOM from "react-dom";
import { BasisProvider, defaultTheme } from "basis";
import Home from "./Home";

function App() {
  return (
    <BasisProvider theme={defaultTheme}>
      <Home />
    </BasisProvider>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
