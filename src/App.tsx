import { Amplify } from '@aws-amplify/core';
import React, { useEffect } from 'react';
import { StyledContainer } from './App.styles';
import { IoTConnectionStatus } from './components';
import { IoTSubscribe } from './components/IoTSubscribe';
import { PublishWithFrequency } from './containers';
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

  const publishThousandMessages = (): void => {
    const timePerMessage = 1 / 1000;
    let i = 1;
    const interval = window.setInterval(() => {
      const payload = { message: `This is payload with index ${i}` };
      IoTClient.instance.publish('dt/test', JSON.stringify(payload));
      i++;
      if (i === 1000) {
        window.clearInterval(interval);
      }
    }, timePerMessage);
  };

  return (
    <StyledContainer>
      <IoTConnectionStatus className="iot-connection-status" />
      <div className="content">
        <PublishWithFrequency />
      </div>
    </StyledContainer>
  );
};
