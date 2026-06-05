import { handle } from 'hono/vercel';
import app from '../../__create/index';

export default function(req, res) {
  if (req.url && req.url.startsWith('/api/integrations/')) {
    req.url = req.url.replace('/api/integrations/', '/integrations/');
  }
  return handle(app)(req, res);
}
