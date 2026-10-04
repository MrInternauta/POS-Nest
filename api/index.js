// Vercel function: the compiled Nest app from `npm run build`, every path is rewritten here (vercel.json)
// eslint-disable-next-line @typescript-eslint/no-var-requires
module.exports = require('../dist/serverless').default;
