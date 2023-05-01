import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import PrismaService from './service/prisma.service';
import { HttpExceptionFilter } from './lib/filters/exception.filter';
import { Logger } from '@nestjs/common';
import startupCleanup from './lib/startup-cleanup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});

  Logger.log('Configuring middleware');
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());

  Logger.log('Configuring Prisma hook');
  const prisma = app.get(PrismaService);
  prisma.$on('beforeExit', async () => await app.close());

  await startupCleanup(app);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
