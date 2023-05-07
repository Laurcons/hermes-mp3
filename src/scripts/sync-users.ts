import { NestFactory } from '@nestjs/core';
import { Prisma, UserRole } from '@prisma/client';
import { readFile } from 'fs/promises';
import * as bcrypt from 'bcrypt';
import { AppModule } from 'src/app.module';
import PrismaService from 'src/service/prisma.service';
import { Logger } from '@nestjs/common';
import * as prompt from 'prompts';
import { config } from 'src/lib/config';

// run with: npx ts-node -r tsconfig-paths/register src/scripts/sync-users.ts

async function run() {
  const app = await NestFactory.create(AppModule, {});
  const prisma = app.get(PrismaService);
  prisma.$on('beforeExit', async () => await app.close());

  let { agreed } = await prompt({
    name: 'agreed',
    type: 'confirm',
    message: `You are about to do this operation on ${config.mongoUrl}. Proceed?`,
  });
  if (!agreed) return;

  Logger.log('Reading file');
  const csv = await readFile('src/scripts/volunts.csv').then((buf) =>
    buf.toString(),
  );
  const rows = csv
    .split('\n')
    .slice(1)
    .map((line) => line.trim());

  Logger.log('Preparing data');
  const data: Prisma.UserCreateManyInput[] = await Promise.all(
    rows.map(async (row) => {
      const [role, name, username, password, mentions] = row.split(',');
      return {
        username,
        password: await bcrypt.hash(password, 12),
        role: role as UserRole,
      };
    }),
  );

  Logger.log('Uploading data');
  await Promise.all(
    data.map((user) =>
      prisma.user.upsert({
        where: { username: user.username },
        create: user,
        update: user,
      }),
    ),
  );

  Logger.log('Done!');
  app.close();
}
run();
