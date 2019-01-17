/**
 * Version and build-number derivation.
 *
 * Nobody types a version number. Both come from git, deterministically, so the same commit
 * always produces the same version and a release can be traced back to an exact tree.
 *
 * The failure this prevents is mundane and extremely common: two builds shipped with the
 * same build number, or a hotfix that claims to be older than the release it fixes. Both
 * are rejected by the store, usually after the build has already taken twenty minutes.
 */

export interface SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string | undefined;
}

export function parseVersion(tag: string): SemanticVersion | null {
  // Accepts v1.2.3 and 1.2.3, with an optional prerelease. Build metadata after a plus is
  // deliberately ignored: it is not part of precedence.
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(tag.trim());
  if (match === null) return null;

  const [, major, minor, patch, prerelease] = match;
  if (major === undefined || minor === undefined || patch === undefined) return null;

  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    ...(prerelease === undefined ? {} : { prerelease }),
  };
}

export function formatVersion(version: SemanticVersion): string {
  const core = `${version.major}.${version.minor}.${version.patch}`;
  return version.prerelease === undefined ? core : `${core}-${version.prerelease}`;
}

/** Negative when a is older. Follows semver precedence: a prerelease sorts below its release. */
export function compareVersions(a: SemanticVersion, b: SemanticVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === undefined) return 1;
  if (b.prerelease === undefined) return -1;
  return a.prerelease.localeCompare(b.prerelease);
}

export type BumpKind = 'major' | 'minor' | 'patch' | 'none';

export function bump(version: SemanticVersion, kind: BumpKind): SemanticVersion {
  switch (kind) {
    case 'major':
      return { major: version.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: version.major, minor: version.minor + 1, patch: 0 };
    case 'patch':
      return { major: version.major, minor: version.minor, patch: version.patch + 1 };
    case 'none':
      return version;
    default: {
      const exhaustive: never = kind;
      void exhaustive;
      return version;
    }
  }
}

// --- Conventional commits ------------------------------------------------------------

export interface ParsedCommit {
  readonly type: string;
  readonly scope: string | undefined;
  readonly breaking: boolean;
  readonly subject: string;
  readonly sha: string;
}

/**
 * Parses one commit subject line.
 *
 * A commit that does not follow the convention is returned with type `other` rather than
 * dropped. Silently ignoring it would mean a genuine change is missing from the release
 * notes, and nobody notices until a user asks why a fix they were promised is not there.
 */
export function parseCommit(sha: string, subject: string): ParsedCommit {
  const match = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/.exec(subject.trim());

  if (match === null) {
    return { type: 'other', scope: undefined, breaking: false, subject: subject.trim(), sha };
  }

  const [, type, scope, bang, description] = match;

  return {
    type: (type ?? 'other').toLowerCase(),
    scope,
    // Either the bang form or a BREAKING CHANGE footer. The footer is matched by the
    // caller, which has the full commit body.
    breaking: bang === '!',
    subject: description ?? subject,
    sha,
  };
}

/**
 * Which bump a set of commits implies.
 *
 * Deliberately conservative: anything unrecognised gets a patch bump rather than nothing.
 * Shipping a build with an unchanged version number is worse than shipping one whose
 * patch number moved for a documentation change.
 */
export function bumpFor(commits: readonly ParsedCommit[]): BumpKind {
  if (commits.length === 0) return 'none';
  if (commits.some((commit) => commit.breaking)) return 'major';
  if (commits.some((commit) => commit.type === 'feat')) return 'minor';
  return 'patch';
}

const RELEASE_NOTE_SECTIONS: ReadonlyArray<{ type: string; heading: string }> = [
  { type: 'feat', heading: 'New' },
  { type: 'fix', heading: 'Fixed' },
  { type: 'security', heading: 'Security' },
  { type: 'perf', heading: 'Performance' },
];

/**
 * Release notes for a store listing.
 *
 * Only the categories a user can perceive. A refactor, a CI change or a test addition is
 * real work and belongs in the changelog, not in the text somebody reads while deciding
 * whether to update. Store reviewers also reject notes that are obviously a commit dump.
 */
export function releaseNotes(commits: readonly ParsedCommit[]): string {
  const breaking = commits.filter((commit) => commit.breaking);
  const lines: string[] = [];

  if (breaking.length > 0) {
    lines.push('Important changes', ...breaking.map((commit) => `- ${commit.subject}`), '');
  }

  for (const section of RELEASE_NOTE_SECTIONS) {
    const matching = commits.filter(
      (commit) => commit.type === section.type && !commit.breaking,
    );
    if (matching.length === 0) continue;

    lines.push(section.heading, ...matching.map((commit) => `- ${commit.subject}`), '');
  }

  if (lines.length === 0) return 'Stability and maintenance improvements.';

  return lines.join('\n').trim();
}

// --- Build numbers -------------------------------------------------------------------

/**
 * Build number from the commit count on the release branch.
 *
 * It has to be monotonic across every build ever submitted, for both stores, or the upload
 * is rejected. Commit count satisfies that on a branch that only moves forward, and unlike
 * a timestamp it is reproducible: the same commit gives the same number.
 *
 * The offset exists for the case where a project migrates into this scheme with builds
 * already submitted. Without it the first build under the new scheme goes backwards and
 * the store refuses it.
 */
export function buildNumber(commitCount: number, offset = 0): number {
  if (!Number.isInteger(commitCount) || commitCount < 0) {
    throw new Error(`Commit count must be a non-negative integer, received ${commitCount}`);
  }
  return commitCount + offset;
}

/**
 * Guards a release against the two mistakes that cost a submission cycle.
 *
 * Both of these are only ever caught by a machine. A person comparing version strings at
 * the end of a release checklist will let them through.
 */
export function validateRelease(input: {
  readonly previousVersion: SemanticVersion;
  readonly nextVersion: SemanticVersion;
  readonly previousBuildNumber: number;
  readonly nextBuildNumber: number;
}): { readonly ok: true } | { readonly ok: false; readonly reason: string } {
  if (compareVersions(input.nextVersion, input.previousVersion) <= 0) {
    return {
      ok: false,
      reason: `Version ${formatVersion(input.nextVersion)} is not ahead of the released ${formatVersion(input.previousVersion)}.`,
    };
  }

  if (input.nextBuildNumber <= input.previousBuildNumber) {
    return {
      ok: false,
      reason: `Build number ${input.nextBuildNumber} is not ahead of the submitted ${input.previousBuildNumber}. Both stores reject this.`,
    };
  }

  return { ok: true };
}
