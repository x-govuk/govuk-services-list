import fs from "node:fs/promises";
import path from "node:path";

import * as esbuild from "esbuild";
import * as sass from "sass";

const assetsDir = path.join(import.meta.dirname, "..", "app", "assets");
const outputDir = path.join(import.meta.dirname, "..", "static");

export async function compileJavaScript(watch) {
  const inputFilePath = path.join(assetsDir, "javascripts", "*.js");
  const options = {
    entryPoints: [inputFilePath],
    entryNames: "[name]",
    bundle: true,
    legalComments: "none",
    minify: true,
    outdir: "static",
    sourcemap: true,
  };

  try {
    await fs.mkdir(outputDir, { recursive: true });
    if (watch) {
      const ctx = await esbuild.context(options);
      await ctx.watch();
    } else {
      await esbuild.build(options);
    }
  } catch (error) {
    console.error("Error compiling JavaScript:", error);
  }
}

export async function compileSass(watch) {
  const inputFilePath = path.join(assetsDir, "stylesheets", "application.scss");
  const outputFilePath = path.join(outputDir, "application.css");
  const options = {
    importers: [new sass.NodePackageImporter()], // Imports with `pkg:`
    loadPaths: ["./node_modules", "."], // Imports without `pkg:`
    quietDeps: true,
    style: "compressed",
    sourceMap: true,
  };

  const writeFiles = async () => {
    const { css, sourceMap } = sass.compile(inputFilePath, options);
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(outputFilePath, css);
    await fs.writeFile(`${outputFilePath}.map`, JSON.stringify(sourceMap));
  };

  if (watch) {
    const controller = new AbortController();
    const watcher = fs.watch(assetsDir, {
      recursive: true,
      signal: controller.signal,
    });

    (async () => {
      try {
        for await (const event of watcher) {
          if (event.filename?.endsWith(".scss")) {
            await writeFiles();
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error watching Sass:", error);
        }
      }
    })();

    return {
      close: () => controller.abort(),
    };
  }

  try {
    await writeFiles();
  } catch (error) {
    console.error("Error compiling Sass:", error);
  }
}
