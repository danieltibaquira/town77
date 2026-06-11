import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const COMPONENTS_DIR = path.join(__dirname, "../components");
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
const ALLOWED_HEX = new Set(["#111", "#111111", "#000", "#000000", "#fff", "#ffffff"]);

describe("design token enforcement", () => {
  it("components avoid hardcoded hex colors except allowlist", () => {
    const files = fs.readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith(".tsx"));
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(COMPONENTS_DIR, file), "utf-8");
      const matches = content.match(HEX_PATTERN) ?? [];
      for (const hex of matches) {
        const normalized = hex.toLowerCase();
        if (!ALLOWED_HEX.has(normalized) && !normalized.startsWith("#rgba")) {
          violations.push(`${file}: ${hex}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
