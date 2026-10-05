import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default setup: no incremental cache needed. The demo keeps its state in the browser.
export default defineCloudflareConfig();
