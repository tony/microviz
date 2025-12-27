import { existsSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cdnBundlePlugin } from "../../vite-plugin-cdn-bundle";

describe("cdnBundlePlugin", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `cdn-bundle-test-${Date.now()}`);
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe("writeBundle", () => {
    it("creates cdn/microviz.js and cdn/microviz.js.map in output directory", async () => {
      const plugin = cdnBundlePlugin();

      // Call writeBundle hook
      if (typeof plugin.writeBundle === "function") {
        await plugin.writeBundle.call(
          {} as never,
          { dir: tempDir } as never,
          {} as never,
        );
      }

      // Verify files exist
      const jsPath = join(tempDir, "cdn", "microviz.js");
      const mapPath = join(tempDir, "cdn", "microviz.js.map");

      expect(existsSync(jsPath)).toBe(true);
      expect(existsSync(mapPath)).toBe(true);

      // Verify JS content is valid
      const jsContent = await readFile(jsPath, "utf-8");
      expect(jsContent.length).toBeGreaterThan(1000); // Should be substantial
      expect(jsContent).toContain("customElements"); // Web components registration

      // Verify source map is valid JSON
      const mapContent = await readFile(mapPath, "utf-8");
      const sourceMap = JSON.parse(mapContent);
      expect(sourceMap).toHaveProperty("version");
      expect(sourceMap).toHaveProperty("sources");
    }, 30000); // Allow 30s for build
  });
});
