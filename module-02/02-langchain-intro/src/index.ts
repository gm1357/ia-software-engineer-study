import { createServer } from "./server.ts";

const app = createServer();

await app.listen({ port: 3000, host: "0.0.0.0" });
console.log(`Server is running at 3000`);
