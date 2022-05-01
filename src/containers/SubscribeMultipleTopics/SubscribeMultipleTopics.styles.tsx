import styled from 'styled-components';

export const StyledSubscribeMultipleTopics = styled.div`
  display: flex;
  flex-direction: column;

  .iot-subscribe {
    margin-bottom: 20px;
  }

  .iot-publish {
    margin-bottom: 20px;
  }

  .iot-logs {
    height: 480px;
    width: 100%;
    padding: 20px;
    box-shadow: inset 0 0 4px 1px rgba(0, 0, 0, 0.2);
    position: relative;
    background: #fff;

    .iot-logs-display {
      width: 100%;
      height: 100%;
      overflow: hidden auto;
    }

    .iot-clear-btn {
      position: absolute;
      top: 20px;
      right: 20px;
    }
  }
`;
