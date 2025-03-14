import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 3000;

  // Log memory usage
  const logMemoryUsage = () => {
    const used = process.memoryUsage();
    return Object.keys(used)
      .map(
        (key) =>
          `${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`,
      )
      .join(', ');
  };

  try {
    // Configure garbage collection if --expose-gc flag is used
    if (global.gc) {
      logger.log('Garbage collection exposed');
      // Run garbage collection every 10 minutes
      setInterval(
        () => {
          const beforeGC = logMemoryUsage();
          global.gc();
          const afterGC = logMemoryUsage();
          logger.log(`GC run - Before: ${beforeGC} | After: ${afterGC}`);
        },
        10 * 60 * 1000,
      );
    } else {
      logger.warn(
        'Garbage collection not exposed. Start with --expose-gc flag for memory management.',
      );
    }

    // Create application
    const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
      logger: ['error', 'warn', 'log'],
      bodyParser: true,
    });

    // Enable CORS with more specific options
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // Log memory usage every 5 minutes
    setInterval(
      () => {
        logger.log(`Memory usage: ${logMemoryUsage()}`);
      },
      5 * 60 * 1000,
    );

    // Start application
    await app.listen(port);
    logger.log(`Application started successfully on port ${port}`);
    logger.log(`Initial memory usage: ${logMemoryUsage()}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}

// Set higher memory limit for Node process
// Note: This doesn't actually change the limit, but it's a reminder
// that you should run the app with --max-old-space-size flag
// e.g. node --max-old-space-size=4096 dist/main.js
bootstrap().catch((err) => {
  console.error('Unhandled bootstrap error:', err);
  process.exit(1);
});
