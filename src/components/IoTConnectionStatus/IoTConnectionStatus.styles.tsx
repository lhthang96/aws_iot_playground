import { COLORS } from 'src/common/colors';
import { IoTClientStatus } from 'src/services/IoTClient.interfaces';
import styled from 'styled-components';

export const StyledIoTConnectionStatus = styled.div<{ status: IoTClientStatus }>`
  background: #fff;
  padding: 20px;
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
    margin-bottom: 24px;

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

  .iot-log {
    width: 100%;
    display: flex;
    flex-direction: column;

    .iot-log-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f5f5f5;
      font-size: 14px;

      .iot-log-header-text {
        margin: 0;
        font-weight: bold;
      }

      .iot-log-clear-btn {
      }
    }

    .iot-log-content {
      display: flex;
      flex-direction: column;
      padding: 8px;
      max-height: 180px;
      overflow: hidden auto;

      .log-item {
        display: flex;
        align-items: flex-start;
        font-size: 14px;
        margin-bottom: 4px;

        .log-item-timestamp {
          width: 64px;
        }

        .log-item-level {
          text-transform: capitalize;
          margin-right: 6px;
          font-weight: bold;

          &.log-item-level-success {
            color: ${COLORS.SUCCESS};
          }
          &.log-item-level-warning {
            color: ${COLORS.WARNING};
          }
          &.log-item-level-info {
            color: ${COLORS.INFO};
          }
          &.log-item-level-error {
            color: ${COLORS.ERROR};
          }
        }

        .log-item-message {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
`;
