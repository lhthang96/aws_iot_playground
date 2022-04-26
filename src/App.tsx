import React from "react";
import { StyledContainer } from "./App.styles";
import { Home } from "./containers";

export const App: React.FC = () => {
  return (
    <StyledContainer>
      <Home />
    </StyledContainer>
  );
};
