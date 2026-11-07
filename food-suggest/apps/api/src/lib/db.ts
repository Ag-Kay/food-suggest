import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.ts';

export type Db = PrismaClient;

/** Creates a Prisma client using the node-postgres driver adapter (Prisma 7). */
export function createDb(databaseUrl: string): Db {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}
