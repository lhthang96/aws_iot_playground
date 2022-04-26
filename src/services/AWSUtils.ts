import { ICredentials } from '@aws-amplify/core';
import { createHash, createHmac } from 'crypto';

export class AWSUtils {
  private static instance: AWSUtils;

  private constructor() {}

  public static getInstance(): AWSUtils {
    if (!AWSUtils.instance) {
      AWSUtils.instance = new AWSUtils();
    }

    return AWSUtils.instance;
  }

  public getSignedUrl = (host: string, region: string, credentials: ICredentials): string => {
    const isoDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = isoDate.substring(0, 8);
    const method = 'GET';
    const protocol = 'wss';
    const uri = '/mqtt';
    const service = 'iotdevicegateway';
    const algorithm = 'AWS4-HMAC-SHA256';

    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    let canonicalQuerystring = `X-Amz-Algorithm=${algorithm}`;
    canonicalQuerystring += `&X-Amz-Credential=${encodeURIComponent(`${credentials.accessKeyId}/${credentialScope}`)}`;
    canonicalQuerystring += `&X-Amz-Date=${isoDate}`;
    canonicalQuerystring += '&X-Amz-SignedHeaders=host';

    const canonicalHeaders = `host:${host}\n`;
    const payloadHash = createHash('sha256').update('').digest('hex');
    const canonicalRequest = `${method}\n${uri}\n${canonicalQuerystring}\n${canonicalHeaders}\nhost\n${payloadHash}`;
    const stringToSign = `${algorithm}\n${isoDate}\n${credentialScope}\n${createHash('sha256')
      .update(canonicalRequest)
      .digest('hex')}`;
    const signingKey = this.getSignatureKey(credentials.secretAccessKey, date, region, service);
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    canonicalQuerystring += `&X-Amz-Signature=${signature}`;
    if (credentials.sessionToken) {
      canonicalQuerystring += `&X-Amz-Security-Token=${encodeURIComponent(credentials.sessionToken)}`;
    }

    const requestUrl = `${protocol}://${host}${uri}?${canonicalQuerystring}`;
    return requestUrl;
  };

  private getSignatureKey = (key: string, date: string, region: string, service: string): Buffer => {
    const kDate = createHmac('sha256', `AWS4${key}`).update(date).digest();
    const kRegion = createHmac('sha256', kDate).update(region).digest();
    const kService = createHmac('sha256', kRegion).update(service).digest();
    const kCredentials = createHmac('sha256', kService).update('aws4_request').digest();
    return kCredentials;
  };
}
