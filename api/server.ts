import 'pg';
import 'pg-hstore';
import app from '../backend/src/app';

// Export Express app as a Vercel serverless function
export default app;
