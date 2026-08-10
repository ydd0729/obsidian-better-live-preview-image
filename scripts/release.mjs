import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const manifest = readJson("manifest.json");
const packageJson = readJson("package.json");
const versions = readJson("versions.json");
const version = manifest.version;
const tag = version;
const branch = capture("git", ["branch", "--show-current"]);
const message = readOption("--message") ?? `Release ${version}`;

assert(branch === "main", `Releases must run from main, not ${branch || "a detached HEAD"}.`);
assert(version === packageJson.version, "manifest.json and package.json versions must match.");
assert(
  versions[version] === undefined || versions[version] === manifest.minAppVersion,
  `versions.json maps ${version} to a different minimum app version.`
);
assert(
  readFileSync("CHANGELOG.md", "utf8").split(/\r?\n/u).includes(`## ${version}`),
  `CHANGELOG.md must contain a "## ${version}" section.`
);
assert(capture("git", ["tag", "--list", tag]) === "", `Local tag ${tag} already exists.`);

const remoteTag = run("git", ["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tag}`], {
  captureOutput: true,
  acceptedStatuses: [0, 2]
});
assert(remoteTag.status === 2, `Remote tag ${tag} already exists.`);

run("git", ["fetch", "origin", branch]);
const [remoteOnly] = capture("git", [
  "rev-list",
  "--left-right",
  "--count",
  `origin/${branch}...HEAD`
]).split(/\s+/u).map(Number);
assert(remoteOnly === 0, `Local ${branch} is behind origin/${branch}; pull or rebase before releasing.`);
assert(capture("git", ["status", "--porcelain"]) !== "", "There are no changes to commit.");

runPnpmScript("lint");
runPnpmScript("build");
run("git", ["diff", "--check"]);

for (const asset of ["main.js", "manifest.json", "styles.css"]) {
  assert(existsSync(asset), `Missing release asset: ${asset}`);
}

if (isDryRun) {
  console.log(`Release ${version} is ready. Dry run did not commit, tag, or push.`);
  process.exit(0);
}

run("git", ["add", "--all"]);
run("git", ["diff", "--cached", "--check"]);
const stagedDiff = run("git", ["diff", "--cached", "--quiet"], {
  acceptedStatuses: [0, 1]
});
assert(stagedDiff.status === 1, "There are no staged changes to commit.");

run("git", ["commit", "--message", message]);
run("git", ["tag", "--annotate", tag, "--message", tag]);
run("git", ["push", "--atomic", "origin", branch, `refs/tags/${tag}`]);

console.log(`Pushed ${branch} and ${tag}. GitHub Actions will publish release ${version}.`);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  assert(value && !value.startsWith("--"), `${name} requires a value.`);
  return value;
}

function runPnpmScript(script) {
  if (process.platform === "win32") {
    run(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `pnpm run ${script}`]);
    return;
  }

  run("pnpm", ["run", script]);
}

function capture(command, commandArgs) {
  return run(command, commandArgs, { captureOutput: true }).stdout.trim();
}

function run(command, commandArgs, options = {}) {
  const { acceptedStatuses = [0], captureOutput = false } = options;
  console.log(`> ${formatCommand(command, commandArgs)}`);

  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    shell: false,
    stdio: captureOutput ? ["ignore", "pipe", "inherit"] : "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (!acceptedStatuses.includes(result.status)) {
    throw new Error(`${command} exited with status ${result.status}.`);
  }

  return {
    status: result.status,
    stdout: result.stdout ?? ""
  };
}

function formatCommand(command, commandArgs) {
  return [command, ...commandArgs]
    .map((part) => (/\s/u.test(part) ? JSON.stringify(part) : part))
    .join(" ");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
