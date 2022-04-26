import React, { ComponentPropsWithoutRef } from 'react';
import { useIoTClientStatus } from 'src/hooks';
import { StyledIoTConnectionStatus } from './IoTConnectionStatus.styles';

type IoTConnectionStatusProps = ComponentPropsWithoutRef<'div'>;

export const IoTConnectionStatus: React.FC<IoTConnectionStatusProps> = (props) => {
  const iotClientStatus = useIoTClientStatus();

  return (
    <StyledIoTConnectionStatus status={iotClientStatus} {...props}>
      <p className="title">IoT Connection</p>
      <div className="iot-status">
        <div className="iot-status-dot" />
        <span className="iot-status-text">{iotClientStatus}</span>
      </div>
    </StyledIoTConnectionStatus>
  );
};
