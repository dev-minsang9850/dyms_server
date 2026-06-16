// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*', // 개발 단계: 전부 허용
    credentials: false,
  });

  // Ensure uploads directory exists
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir);
  }

  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  await app.listen(3000);
  console.log(`DYMS server running on: ${await app.getUrl()}`);
}
bootstrap();
