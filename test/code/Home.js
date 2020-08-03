import React from "react";
import { Text, Link } from "basis";

function Home() {
  return (
    <React.Fragment>
      <Text textStyle="subtitle2">
        Want to know how your design system components are being used?
      </Text>
      <Text margin="4 0 0 0">
        Try{" "}
        <Link href="https://github.com/moroshko/react-scanner" newTab>
          react-scanner
        </Link>
      </Text>
      <div style={{ marginTop: 16 }}>Hope you like it :)</div>
    </React.Fragment>
  );
}

export default Home;
