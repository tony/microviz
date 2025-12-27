/**
 * Vite plugin that builds and serves the CDN bundle on-demand.
 *
 * This plugin intercepts requests to /cdn/microviz.js and builds the bundle
 * in-memory using vite.build(). The result is cached and automatically
 * invalidated when source files change.
 *
 * Benefits:
 * - No predev step required
 * - Automatic rebuild on source changes
 * - In-memory caching (no disk I/O)
 * - Deduplicates concurrent build requests
 */
import { resolve } from "node:path";
import { build, type Plugin } from "vite";

const SOURCE_PATTERNS = [
  /packages\/core\/src\//,
  /packages\/elements\/src\//,
  /packages\/renderers\/src\//,
];

export function cdnBundlePlugin(): Plugin {
  let cache: { code: string; map: string } | null = null;
  let buildPromise: Promise<void> | null = null;

  // Get the packages directory (parent of demo)
  const packagesDir = resolve(import.meta.dirname, "..");

  async function buildBundle(logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  }): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await build({
        build: {
          lib: {
            entry: resolve(packagesDir, "elements/src/index.ts"),
            fileName: () => "microviz.js",
            formats: ["es"],
          },
          minify: "esbuild",
          rollupOptions: {
            external: [],
          },
          sourcemap: true,
          write: false,
        },
        configFile: false,
        logLevel: "warn",
        resolve: {
          alias: {
            "@microviz/core": resolve(packagesDir, "core/src/index.ts"),
            "@microviz/renderers": resolve(
              packagesDir,
              "renderers/src/index.ts",
            ),
          },
        },
        root: resolve(packagesDir, "elements"),
      });

      // Extract code from build result
      if (Array.isArray(result)) {
        for (const output of result[0].output) {
          if (output.type === "chunk" && output.isEntry) {
            cache = {
              code: output.code,
              map: output.map?.toString() ?? "",
            };
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`[cdn-bundle] Built in ${duration}ms`);
    } catch (error) {
      logger.error(
        `[cdn-bundle] Build failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  return {
    configureServer(server) {
      // Watch for source changes and invalidate cache
      server.watcher.on("change", (file) => {
        if (SOURCE_PATTERNS.some((p) => p.test(file))) {
          cache = null;
          server.config.logger.info("[cdn-bundle] Cache invalidated");
        }
      });

      // Serve the CDN bundle
      server.middlewares.use(async (req, res, next) => {
        if (
          req.url !== "/cdn/microviz.js" &&
          req.url !== "/cdn/microviz.js.map"
        ) {
          return next();
        }

        // Build if needed (with deduplication)
        if (!cache) {
          if (!buildPromise) {
            buildPromise = buildBundle(server.config.logger).finally(() => {
              buildPromise = null;
            });
          }
          try {
            await buildPromise;
          } catch {
            res.statusCode = 500;
            res.end("Build failed");
            return;
          }
        }

        if (!cache) {
          res.statusCode = 500;
          res.end("Build failed");
          return;
        }

        // Serve the appropriate file
        if (req.url === "/cdn/microviz.js.map") {
          res.setHeader("Content-Type", "application/json");
          res.end(cache.map);
        } else {
          res.setHeader("Content-Type", "application/javascript");
          res.end(cache.code);
        }
      });
    },
    name: "cdn-bundle",
  };
}
