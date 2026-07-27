import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Clara Luxe E-Commerce Server Running on Port ${PORT} `);
  console.log(` Health check: http://localhost:${PORT}/health   `);
  console.log(`=================================================`);
});
