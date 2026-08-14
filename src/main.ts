// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Apply Helmet for HTTP Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: false, // 필요 시 정적 파일 로딩을 위해 해제
  }));

  app.enableCors({
    origin: ['https://paulee.me', 'https://api.paulee.me', 'http://localhost:3000'],
    credentials: true,
  });

  // Increase payload limit for profile pictures
  const express = require('express');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Ensure uploads directory exists
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir);
  }

  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  await app.listen(3000, '0.0.0.0');
  console.log(`DYMS server running on: ${await app.getUrl()}`);
}
bootstrap();
