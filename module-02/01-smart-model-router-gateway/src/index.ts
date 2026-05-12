import { config } from "./config.ts";
import { OpenRouterService } from "./openrouterService.ts";
import { createServer } from "./server.ts";

const routerService = new OpenRouterService(config);

const app = createServer(routerService);

await app.listen({ port: config.port, host: "0.0.0.0" });
console.log(`Server is running at ${config.port}`);
