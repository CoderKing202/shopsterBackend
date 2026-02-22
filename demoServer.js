const express = require('express');

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Demo server is running');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'shopster-demo-server',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/echo', (req, res) => {
  res.status(200).json({
    message: 'Echo from demo server',
    body: req.body,
  });
});

app.listen(port, () => {
  console.log(`Demo server listening on port ${port}`);
});
