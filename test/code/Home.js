import React from "react";
import { Text, Link } from "basis";
import { styled } from "stitches";

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
      <Button onClick={() => test}>Test</Button>
    </React.Fragment>
  );
}

const Button = styled("button", {});

export default Home;
