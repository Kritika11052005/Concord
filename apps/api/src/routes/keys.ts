import { Router } from 'express';
import type { Request, Response } from 'express';

export const keysRouter = Router();

keysRouter.get('/', (_req: Request, res: Response): void => {
  const publicKeyV1 = process.env.SIGNING_PUBLIC_KEY_V1 || 'MCowBQYDK2VwAyEAmY9GcdsdHa2RGWfynRvZx6mh6hvNJC2ofF74NGM30z0=';
  res.json({
    keys: [
      {
        version: 1,
        algorithm: 'Ed25519',
        format: 'SPKI_DER_BASE64',
        public_key: publicKeyV1,
        status: 'active',
      },
    ],
  });
});
