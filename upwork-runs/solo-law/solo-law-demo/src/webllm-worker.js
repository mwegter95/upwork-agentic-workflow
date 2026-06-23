// ESM module worker — Angular copies to dist root via angular.json assets
import { WebWorkerMLCEngineHandler } from "https://esm.run/@mlc-ai/web-llm";
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
