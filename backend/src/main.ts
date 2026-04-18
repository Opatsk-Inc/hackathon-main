import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://api.main.notfounds.dev',
      'https://main.notfounds.dev',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Request Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Helmet Middleware against known security vulnerabilities
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  // Swagger API Documentation
  const options = new DocumentBuilder()
    .setTitle('LionsShare API')
    .setDescription(
      'B2G SaaS platform for detecting tax evasion via Real Estate ↔ Land Registry cross-matching. ')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 1488, '0.0.0.0');
}

bootstrap();
