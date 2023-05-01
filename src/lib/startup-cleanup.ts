import { INestApplication, Logger } from '@nestjs/common';
import PrismaService from 'src/service/prisma.service';

export default async function startupCleanup(app: INestApplication) {
  const prisma = app.get(PrismaService);
  const logger = new Logger('StartupCleanup');

  logger.log('Marking all sessions as inactive');
  await prisma.session.updateMany({
    where: { wsId: { not: null } },
    data: { wsId: null },
  });
}
