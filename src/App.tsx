import { Amplify } from '@aws-amplify/core';
import React, { useEffect } from 'react';
import { StyledContainer } from './App.styles';
import { IoTConnectionStatus } from './components';
import { SubscribeMultipleTopics } from './containers';
import { IoTClient } from './services/IoTClient';

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
    IoTClient.instance.init();
  }, []);

  return (
    <StyledContainer>
      <IoTConnectionStatus className="iot-connection-status" />
      <div className="content">
        <SubscribeMultipleTopics />
      </div>
    </StyledContainer>
  );
};
