import crypto from 'node:crypto';

export const sha256 = (value = '') => crypto.createHash('sha256').update(String(value)).digest('hex');

export const randomToken = (size = 32) => crypto.randomBytes(size).toString('base64url');

export const createRecordId = () => crypto.randomUUID();

export const signPayload = (payload, secret) => {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
};

export const verifySignedPayload = (token, secret) => {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [encodedPayload, providedSignature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    if (providedSignature !== expectedSignature) return null;
    try {
        return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    } catch (error) {
        return null;
    }
};
