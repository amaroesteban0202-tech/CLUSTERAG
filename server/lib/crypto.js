import crypto from 'node:crypto';

export const sha256 = (value = '') => crypto.createHash('sha256').update(String(value)).digest('hex');

export const randomToken = (size = 32) => crypto.randomBytes(size).toString('base64url');

export const createRecordId = () => crypto.randomUUID();

export const safeEqual = (left = '', right = '') => {
    const leftBuffer = Buffer.from(String(left));
    const rightBuffer = Buffer.from(String(right));
    return leftBuffer.length === rightBuffer.length
        && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const signPayload = (payload, secret) => {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
};

export const verifySignedPayload = (token, secret) => {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [encodedPayload, providedSignature] = token.split('.');
    if (!encodedPayload || !providedSignature) return null;
    const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
        providedBuffer.length !== expectedBuffer.length
        || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) return null;
    try {
        return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    } catch (error) {
        return null;
    }
};
