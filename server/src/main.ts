import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({ origin: corsOrigin });

  app.use(require('express').json({ limit: '1mb' }));

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, () => {
    console.log(`Server NestJS rodando em http://localhost:${port}`);
  });
}
bootstrap();
