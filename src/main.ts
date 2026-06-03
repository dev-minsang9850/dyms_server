// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // 개발 단계: 전부 허용
    credentials: false,
  });

  await app.listen(3000);
  console.log(`DYMS server running on: ${await app.getUrl()}`);
}
bootstrap();
