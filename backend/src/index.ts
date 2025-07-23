import { app } from './app';
import dotenv from 'dotenv';
import { requestLogger } from './middleware/requestLogger';
import { connectDatabase, disconnectDatabase } from './config/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Add request logger only for non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();