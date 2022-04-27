import React, { ComponentPropsWithoutRef, createElement, useEffect, useRef } from 'react';
import { Subscription } from 'rxjs';
import { useIoTClientStatus } from 'src/hooks';
import { IoTClient } from 'src/services/IoTClient';
import { IoTClientLog } from 'src/services/IoTClient.interfaces';
import { StyledIoTConnectionStatus } from './IoTConnectionStatus.styles';

const NO_LOG_TEXT = 'There is no log from IoT Client';

type IoTConnectionStatusProps = ComponentPropsWithoutRef<'div'>;

export const IoTConnectionStatus: React.FC<IoTConnectionStatusProps> = (props) => {
  const iotClientStatus = useIoTClientStatus();

  const refIotLogList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const subscription = IoTClient.instance.log$.subscribe({
      next: (log) => {
        if (!refIotLogList.current) return;

        if (refIotLogList.current.innerHTML === NO_LOG_TEXT) {
          refIotLogList.current.innerHTML = '';
        }

        const node = createLogItem(log);
        refIotLogList.current.appendChild(node);
        refIotLogList.current.scrollTop = refIotLogList.current.scrollHeight;
      },
    });

    return (): void => subscription.unsubscribe();
  }, []);

  return (
    <StyledIoTConnectionStatus status={iotClientStatus} {...props}>
      <p className="title">IoT Client</p>
      <div className="iot-status">
        <div className="iot-status-dot" />
        <span className="iot-status-text">{iotClientStatus}</span>
      </div>
      <div className="iot-log">
        <div className="iot-log-header">
          <p className="iot-log-header-text">Logs</p>
          <button
            className="iot-log-clear-btn"
            onClick={(): void => {
              if (refIotLogList.current) {
                refIotLogList.current.innerHTML = NO_LOG_TEXT;
              }
            }}
          >
            Clear
          </button>
        </div>
        <div className="iot-log-content" ref={refIotLogList}>
          {NO_LOG_TEXT}
        </div>
      </div>
    </StyledIoTConnectionStatus>
  );
};

const createLogItem = (log: IoTClientLog): HTMLParagraphElement => {
  const logItem = document.createElement('p');
  logItem.setAttribute('id', log.timestamp.toString());
  logItem.setAttribute('class', 'log-item');

  // Timestamp
  const timestamp = document.createElement('span');
  timestamp.setAttribute('class', 'log-item-timestamp');
  timestamp.innerText = new Date(log.timestamp).toTimeString().split(' ')[0];
  logItem.appendChild(timestamp);

  // Level
  if (log.level !== 'default') {
    const level = document.createElement('span');
    level.setAttribute('class', `log-item-level log-item-level-${log.level}`);
    level.innerText = log.level;
    logItem.appendChild(level);
  }

  // Message
  const message = document.createElement('span');
  message.setAttribute('class', 'log-item-message');
  message.setAttribute('title', log.message);
  message.innerText = log.message;
  logItem.appendChild(message);

  return logItem;
};
