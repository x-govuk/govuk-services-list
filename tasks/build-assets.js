import { compileJavaScript, compileSass } from "../lib/assets.js";

async function buildAssets() {
  const watch = process.argv.includes("--watch") || process.argv.includes("-w");

  if (watch) {
    // Initial compilation
    await Promise.all([compileSass(), compileJavaScript()]);

    // Create Browsersync instance
    const browserSync = await import("browser-sync");
    const bs = browserSync.create();

    bs.init({
      proxy: "localhost:3100",
      files: ["static/**/*.css", "static/**/*.js", "app/views/**/*"],
      open: false,
      notify: false,
    });

    // Start watchers
    const watchSass = await compileSass(true);
    const watchJavaScript = await compileJavaScript(true);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.info("Stopping watchers…");
      if (watchSass) watchSass.close();
      if (watchJavaScript) watchJavaScript.dispose();
      bs.exit();
      process.exit(0);
    });

    console.info("Started watching, press Ctrl+C to stop");

    // Keep the process running
    await new Promise(() => {});
  } else {
    await Promise.all([compileSass(), compileJavaScript()]);

    console.info("Assets compiled successfully");
  }
}

buildAssets().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
