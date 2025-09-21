import { env } from "./env";
import { app } from "./app";
import { connectDatabase } from "./prisma";

const port = env.PORT;

async function bootstrap() {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
