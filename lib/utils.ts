import crypto from 'crypto';

export const generateActionId = () => crypto.randomBytes(10).toString('hex');
