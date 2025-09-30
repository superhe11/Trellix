
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env");
const app_1 = require("./app");
const prisma_1 = require("./prisma");
const port = env_1.env.PORT;
async function bootstrap() {
    await (0, prisma_1.connectDatabase)();
    app_1.app.listen(port, () => {
        console.log(`API listening on port ${port}`);
    });
}
bootstrap().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map