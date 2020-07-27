import React from "react";
import { Container, Text, Link } from "basis";

function Home() {
  return (
    <Container margin="4" hasBreakpointWidth>
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
    </Container>
  );
}

export default Home;
