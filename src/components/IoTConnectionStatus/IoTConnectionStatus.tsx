import React, { ComponentPropsWithoutRef, useEffect } from 'react';
import { useIoTClientStatus } from 'src/hooks';
import { IoTClient } from 'src/services/IoTClient';
import { StyledIoTConnectionStatus } from './IoTConnectionStatus.styles';

type IoTConnectionStatusProps = ComponentPropsWithoutRef<'div'>;

export const IoTConnectionStatus: React.FC<IoTConnectionStatusProps> = (props) => {
  const iotClientStatus = useIoTClientStatus();

  useEffect(() => {
    if (iotClientStatus !== 'connected') return undefined;
    const subscription = IoTClient.instance.subscribe('dt/+/test').subscribe({
      next: ({ topic, payload }) => {
        console.log({ topic, payload });
      },
    });

    return (): void => subscription.unsubscribe();
  }, [iotClientStatus]);

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
