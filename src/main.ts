import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import PrismaService from './service/prisma.service';
import { HttpExceptionFilter } from './lib/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());

  const prisma = app.get(PrismaService);
  prisma.$on('beforeExit', async () => await app.close());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
