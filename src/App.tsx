import { Amplify } from '@aws-amplify/core';
import React, { ReactElement, useEffect, useState } from 'react';
import { StyledContainer } from './App.styles';
import { IoTConnectionStatus } from './components';
import { PublishWithFrequency, SubscribeMultipleTopics } from './containers';
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
  // Init IoT Client
  useEffect(() => {
    IoTClient.instance.init();
  }, []);

  // Render test scenarios
  const [testScenarioId, setTestScenarioId] = useState<TestScenarioId>();
  const renderScenario = (): ReactElement => {
    if (!testScenarioId) return <span className="select-test-case-hint">Please select a test scenario</span>;
    const { title, render } = TEST_SCENARIOS[testScenarioId];
    return (
      <>
        <h4>{title}</h4>
        {render()}
      </>
    );
  };
  const renderScenarioOptions = (): ReactElement[] => {
    return Object.entries(TEST_SCENARIOS).map(([id, scenario]) => {
      const { title } = scenario;
      return (
        <button key={id} className="scenario-btn" onClick={(): void => setTestScenarioId(id as TestScenarioId)}>
          {title}
        </button>
      );
    });
  };

  return (
    <StyledContainer>
      <div className="sidebar">
        <IoTConnectionStatus className="iot-connection-status" />
        <div className="scenario-picker">{renderScenarioOptions()}</div>
      </div>
      <div className="content">{renderScenario()}</div>
    </StyledContainer>
  );
};

const TEST_SCENARIOS: { [key in TestScenarioId]: TestScenario } = {
  'publish-with-frequency': {
    title: 'Publish with frequency',
    render: (): ReactElement => <PublishWithFrequency />,
  },
  'subscribe-multiple-topics': {
    title: 'Subscribe multiple topics',
    render: (): ReactElement => <SubscribeMultipleTopics />,
  },
};

type TestScenario = {
  title: string;
  render: () => ReactElement;
};

type TestScenarioId = 'publish-with-frequency' | 'subscribe-multiple-topics';
