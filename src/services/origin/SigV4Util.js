/**
 * This is originally created by github user Dinesh5799
 *
 * https://github.com/Dinesh5799/AWS_MQTT_IOT_Reconnect/blob/master/SigV4Utils.js
 */

/**
 * Cannot refer to the exact version of aws-sdk which is used in this sample code, but it works with version aws-sdk@1.14.0
 *
 * We only use some util functions of the sdk which can easily be replaced with crypto library
 */
import { createHash, createHmac } from 'crypto';

export default function SigV4Utils() {}

const awsCryptoUtil = new AWSCryptoUtil();

SigV4Utils.getSignatureKey = function (key, date, region, service) {
  const kDate = awsCryptoUtil.hmac(`AWS4${key}`, date, 'buffer');
  const kRegion = awsCryptoUtil.hmac(kDate, region, 'buffer');
  const kService = awsCryptoUtil.hmac(kRegion, service, 'buffer');
  const kCredentials = awsCryptoUtil.hmac(kService, 'aws4_request', 'buffer');
  return kCredentials;
};

SigV4Utils.getSignedUrl = function (host, region, credentials) {
  const datetime = awsCryptoUtil.iso8601(new Date()).replace(/[:-]|\.\d{3}/g, '');
  const date = datetime.substr(0, 8);

  const method = 'GET';
  const protocol = 'wss';
  const uri = '/mqtt';
  const service = 'iotdevicegateway';
  const algorithm = 'AWS4-HMAC-SHA256';

  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  let canonicalQuerystring = `X-Amz-Algorithm=${algorithm}`;
  canonicalQuerystring += `&X-Amz-Credential=${encodeURIComponent(`${credentials.accessKeyId}/${credentialScope}`)}`;
  canonicalQuerystring += `&X-Amz-Date=${datetime}`;
  canonicalQuerystring += '&X-Amz-SignedHeaders=host';

  const canonicalHeaders = `host:${host}\n`;
  const payloadHash = awsCryptoUtil.sha256('', 'hex');
  const canonicalRequest = `${method}\n${uri}\n${canonicalQuerystring}\n${canonicalHeaders}\nhost\n${payloadHash}`;

  const stringToSign = `${algorithm}\n${datetime}\n${credentialScope}\n${awsCryptoUtil.sha256(
    canonicalRequest,
    'hex'
  )}`;
  const signingKey = SigV4Utils.getSignatureKey(credentials.secretAccessKey, date, region, service);
  const signature = awsCryptoUtil.hmac(signingKey, stringToSign, 'hex');

  canonicalQuerystring += `&X-Amz-Signature=${signature}`;
  if (credentials.sessionToken) {
    canonicalQuerystring += `&X-Amz-Security-Token=${encodeURIComponent(credentials.sessionToken)}`;
  }

  const requestUrl = `${protocol}://${host}${uri}?${canonicalQuerystring}`;
  return requestUrl;
};

/**
 * This module is cloned from aws-sdk@1.14.0
 */
class AWSCryptoUtil {
  hmac(key, string, digest, fn) {
    if (!digest) digest = 'binary';
    if (digest === 'buffer') {
      digest = undefined;
    }
    if (!fn) fn = 'sha256';
    if (typeof string === 'string') string = new Buffer(string);
    return createHmac(fn, key).update(string).digest(digest);
  }

  sha256(string, digest) {
    if (!digest) {
      digest = 'binary';
    }
    if (digest === 'buffer') {
      digest = undefined;
    }
    if (typeof string === 'string') string = new Buffer(string);
    return this.createHash('sha256').update(string).digest(digest);
  }

  createHash(algorithm) {
    return createHash(algorithm);
  }

  /**
   * Date utils
   */

  getDate() {
    return new Date();
  }

  /**
   * @return [String] the date in ISO-8601 format
   */
  iso8601(date) {
    if (date === undefined) {
      date = this.getDate();
    }
    return date.toISOString();
  }
}
