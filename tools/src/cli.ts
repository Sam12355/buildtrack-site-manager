import { execFileSync } from 'node:child_process';

import {
  bump,
  bumpFor,
  buildNumber,
  compareVersions,
  formatVersion,
  parseCommit,
  parseVersion,
  releaseNotes,
  validateRelease,
  type ParsedCommit,
  type SemanticVersion,
} from './versioning';

/**
 * The command line the pipeline calls.
 *
 * There is one implementation of the derivation rules and it is the tested one. Fastlane
 * and the GitHub workflows read the result rather than reimplementing it, so the version
 * a build claims and the version the tests check are the same computation.
 *
 *   node dist/cli.js derive    -> "1.5.0,1337"
 *   node dist/cli.js notes     -> release notes for a store listing
 *   node dist/cli.js validate  -> exit 1 if this release could not be submitted
 */

/**
 * Runs git, with stderr suppressed.
 *
 * Several calls here are expected to fail: a repository with no tags, or a tag that does
 * not exist yet. Those are handled, and letting git print "fatal: No names found" to the
 * console makes a successful run look broken to whoever is reading the build log.
 */
function git(...args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function lastTag(): SemanticVersion {
  try {
    const tag = git('describe', '--tags', '--abbrev=0');
    const parsed = parseVersion(tag);
    if (parsed !== null) return parsed;

    process.stderr.write(`Latest tag "${tag}" is not a version. Treating this as 0.0.0.\n`);
  } catch {
    // No tags at all. A first release, which is a legitimate state rather than an error.
    process.stderr.write('No tags found. Treating this as the first release.\n');
  }

  return { major: 0, minor: 0, patch: 0 };
}

function commitsSince(version: SemanticVersion): ParsedCommit[] {
  const tag = `v${formatVersion(version)}`;

  let range: string;
  try {
    git('rev-parse', tag);
    range = `${tag}..HEAD`;
  } catch {
    // The tag does not exist, so everything is new.
    range = 'HEAD';
  }

  const log = git('log', range, '--no-merges', '--format=%h%x09%s');
  if (log.length === 0) return [];

  return log.split('\n').map((line) => {
    const [sha, ...rest] = line.split('\t');
    return parseCommit(sha ?? 'unknown', rest.join('\t'));
  });
}

function commitCount(): number {
  return Number(git('rev-list', '--count', 'HEAD'));
}

function derive(): { version: SemanticVersion; build: number; commits: ParsedCommit[] } {
  const previous = lastTag();
  const commits = commitsSince(previous);
  const version = bump(previous, bumpFor(commits));

  // The offset exists for a project migrating into this scheme with builds already
  // submitted. Without it the first build under the new scheme goes backwards and the
  // store refuses it.
  const offset = Number(process.env['BUILD_NUMBER_OFFSET'] ?? '0');
  const build = buildNumber(commitCount(), Number.isFinite(offset) ? offset : 0);

  return { version, build, commits };
}

function main(): void {
  const command = process.argv[2] ?? 'derive';

  switch (command) {
    case 'derive': {
      const { version, build } = derive();
      // Comma separated, because Fastlane splits it and nothing here needs JSON.
      process.stdout.write(`${formatVersion(version)},${build}\n`);
      return;
    }

    case 'notes': {
      const { commits } = derive();
      process.stdout.write(`${releaseNotes(commits)}\n`);
      return;
    }

    case 'validate': {
      const previous = lastTag();
      const { version, build } = derive();

      const previousBuild = Number(process.env['PREVIOUS_BUILD_NUMBER'] ?? '0');

      const result = validateRelease({
        previousVersion: previous,
        nextVersion: version,
        previousBuildNumber: Number.isFinite(previousBuild) ? previousBuild : 0,
        nextBuildNumber: build,
      });

      if (!result.ok) {
        // Exit non-zero so the pipeline stops here rather than twenty minutes later at
        // the upload step, which is where a person would otherwise find out.
        process.stderr.write(`Release refused: ${result.reason}\n`);
        process.exit(1);
      }

      process.stdout.write(
        `OK: ${formatVersion(previous)} -> ${formatVersion(version)}, build ${previousBuild} -> ${build}\n`,
      );
      return;
    }

    case 'compare': {
      const a = parseVersion(process.argv[3] ?? '');
      const b = parseVersion(process.argv[4] ?? '');
      if (a === null || b === null) {
        process.stderr.write('Usage: cli.js compare <version> <version>\n');
        process.exit(2);
      }
      process.stdout.write(`${compareVersions(a, b)}\n`);
      return;
    }

    default:
      process.stderr.write(`Unknown command "${command}". Try derive, notes, validate or compare.\n`);
      process.exit(2);
  }
}

main();
