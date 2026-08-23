import { Router } from 'express';
import type { Request, Response } from 'express';
import { CATALOG, runBuyerAgent } from '@concord/core';

export const agentRouter = Router();

agentRouter.get('/catalog', (_req: Request, res: Response): void => {
  res.json({
    catalog: CATALOG,
    total: CATALOG.length,
  });
});

agentRouter.post('/run', (req: Request, res: Response): void => {
  const { intent_text, merchant_id } = req.body;
  if (!intent_text || typeof intent_text !== 'string') {
    res.status(400).json({ error: { code: 'INVALID_INTENT', message: 'intent_text is required' } });
    return;
  }

  const result = runBuyerAgent(
    intent_text,
    CATALOG,
    merchant_id || '00000000-0000-0000-0000-000000000001'
  );

  res.json(result);
});
