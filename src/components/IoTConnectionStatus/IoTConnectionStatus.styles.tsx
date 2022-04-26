import { COLORS } from 'src/common/colors';
import { IoTClientStatus } from 'src/services/IoTClient.interfaces';
import styled from 'styled-components';

export const StyledIoTConnectionStatus = styled.div<{ status: IoTClientStatus }>`
  background: #fff;
  padding: 20px 32px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.2);

  .title {
    font-size: 16px;
    font-weight: bold;
    color: ${COLORS.TEXT};
  }

  .iot-status {
    width: 100%;
    display: flex;
    align-items: center;

    .iot-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      margin-top: 2px;
      background: ${(props): string => {
        switch (props.status) {
          case 'connected':
            return COLORS.SUCCESS;
          case 'reconnecting':
            return COLORS.WARNING;
          case 'error':
            return COLORS.ERROR;
          case 'initializing':
            return COLORS.INFO;
          default:
            return COLORS.TEXT;
        }
      }};
    }

    .iot-status-text {
      text-transform: capitalize;
    }
  }
`;
