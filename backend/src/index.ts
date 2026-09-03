import app from './app';

const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log('=========================================');
  console.log(`🚀 Modexastock API Server`);
  console.log(`🌍 Environment: ${ENV}`);
  console.log(`🔌 Running on port: ${PORT}`);
  if (ENV === 'development') {
    console.log(`📱 Local: http://localhost:${PORT}`);
  }
  console.log('=========================================');
});
