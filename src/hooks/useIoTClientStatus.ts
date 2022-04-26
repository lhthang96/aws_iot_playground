import { useEffect, useState } from 'react';
import { IoTClient } from 'src/services/IoTClient';
import { IoTClientStatus } from 'src/services/IoTClient.interfaces';

export const useIoTClientStatus = (): IoTClientStatus => {
  const [status, setStatus] = useState<IoTClientStatus>(IoTClient.getInstance().status);

  useEffect(() => {
    const subscription = IoTClient.getInstance().status$.subscribe({
      next: (status) => {
        setStatus(status);
      },
    });
  }, []);

  return status;
};
