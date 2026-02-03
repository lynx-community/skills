import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const skills = JSON.parse(
  execFileSync("pnpm", ["list", "--recursive", "--depth", "-1", "--json"], {
    encoding: "utf-8",
  }),
).filter((workspace) => workspace.name.startsWith("@lynx-js/skill-"));

for (const skill of skills) {
  const { name, path } = skill;
  execFileSync(
    "./node_modules/.bin/build-plugin",
    [
      "-C",
      path,
      "export",
      "--skip-build",
        resolve(process.cwd(), "skills", name.replace("@lynx-js/skill-", "")),
    ],
    {
      stdio: "inherit",
    },
  );
  console.error(`Exported skill: ${name}`);
}
