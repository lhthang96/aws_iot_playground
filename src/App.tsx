import React, { useEffect } from 'react';
import { StyledContainer } from './App.styles';
import { Amplify } from '@aws-amplify/core';
import { IoTClient } from './services/IoTClient';
import { useIoTClientStatus } from './hooks';
import { IoTConnectionStatus } from './components';

Amplify.configure({
  Auth: {
    identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
    region: process.env.REACT_APP_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
  },
});

export const App: React.FC = () => {
  useEffect(() => {
    IoTClient.getInstance().init();
  }, []);

  return (
    <StyledContainer>
      <IoTConnectionStatus className="iot-connection-status" />
    </StyledContainer>
  );
};
