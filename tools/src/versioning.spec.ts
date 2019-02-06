import { describe, expect, it } from 'vitest';

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
} from './versioning';

describe('parsing a tag', () => {
  it.each([
    ['v1.2.3', { major: 1, minor: 2, patch: 3 }],
    ['1.2.3', { major: 1, minor: 2, patch: 3 }],
    ['v0.0.1', { major: 0, minor: 0, patch: 1 }],
    ['v10.20.30', { major: 10, minor: 20, patch: 30 }],
  ])('parses %s', (tag, expected) => {
    expect(parseVersion(tag)).toEqual(expected);
  });

  it('keeps a prerelease', () => {
    expect(parseVersion('v2.0.0-rc.1')).toEqual({
      major: 2,
      minor: 0,
      patch: 0,
      prerelease: 'rc.1',
    });
  });

  it('ignores build metadata, which is not part of precedence', () => {
    expect(parseVersion('v1.0.0+20260314')).toEqual({ major: 1, minor: 0, patch: 0 });
  });

  it.each(['not-a-tag', 'v1.2', 'v1.2.3.4', '', 'release-1.2.3'])(
    'rejects %s',
    (tag) => {
      expect(parseVersion(tag)).toBeNull();
    },
  );

  it('tolerates surrounding whitespace, which git output has', () => {
    expect(parseVersion('  v1.2.3\n')).toEqual({ major: 1, minor: 2, patch: 3 });
  });
});

describe('comparing versions', () => {
  it('orders by major, then minor, then patch', () => {
    const v = (tag: string) => parseVersion(tag)!;
    expect(compareVersions(v('1.0.0'), v('2.0.0'))).toBeLessThan(0);
    expect(compareVersions(v('1.2.0'), v('1.1.0'))).toBeGreaterThan(0);
    expect(compareVersions(v('1.1.1'), v('1.1.1'))).toBe(0);
  });

  it('sorts a prerelease below its release', () => {
    const v = (tag: string) => parseVersion(tag)!;
    expect(compareVersions(v('2.0.0-rc.1'), v('2.0.0'))).toBeLessThan(0);
    expect(compareVersions(v('2.0.0'), v('2.0.0-rc.1'))).toBeGreaterThan(0);
  });

  it('orders prereleases against each other', () => {
    const v = (tag: string) => parseVersion(tag)!;
    expect(compareVersions(v('2.0.0-rc.1'), v('2.0.0-rc.2'))).toBeLessThan(0);
  });
});

describe('bumping', () => {
  const base = { major: 1, minor: 4, patch: 7 };

  it('resets everything below a major bump', () => {
    expect(bump(base, 'major')).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  it('resets patch on a minor bump', () => {
    expect(bump(base, 'minor')).toEqual({ major: 1, minor: 5, patch: 0 });
  });

  it('increments only patch', () => {
    expect(bump(base, 'patch')).toEqual({ major: 1, minor: 4, patch: 8 });
  });

  it('leaves the version alone for none', () => {
    expect(bump(base, 'none')).toEqual(base);
  });
});

describe('parsing commits', () => {
  it('parses type, scope and subject', () => {
    expect(parseCommit('abc1234', 'feat(sos): add a cancel window')).toEqual({
      sha: 'abc1234',
      type: 'feat',
      scope: 'sos',
      breaking: false,
      subject: 'add a cancel window',
    });
  });

  it('parses a commit with no scope', () => {
    const parsed = parseCommit('abc1234', 'fix: stop the countdown resetting on rotation');
    expect(parsed.type).toBe('fix');
    expect(parsed.scope).toBeUndefined();
  });

  it('recognises the breaking marker', () => {
    expect(parseCommit('abc1234', 'feat(api)!: remove the v0 endpoints').breaking).toBe(true);
  });

  it('keeps a non-conforming commit rather than dropping it', () => {
    // Dropping it would leave a genuine change out of the release notes, and nobody
    // notices until a user asks where their fix went.
    const parsed = parseCommit('abc1234', 'Merge pull request #42 from feature/x');
    expect(parsed.type).toBe('other');
    expect(parsed.subject).toBe('Merge pull request #42 from feature/x');
  });

  it('lowercases the type so FEAT and feat group together', () => {
    expect(parseCommit('abc1234', 'FEAT: something').type).toBe('feat');
  });
});

describe('deciding the bump', () => {
  const commit = (subject: string) => parseCommit('sha', subject);

  it('is none for no commits', () => {
    expect(bumpFor([])).toBe('none');
  });

  it('is major when anything is breaking', () => {
    expect(bumpFor([commit('fix: a'), commit('feat(api)!: b')])).toBe('major');
  });

  it('is minor for a feature', () => {
    expect(bumpFor([commit('fix: a'), commit('feat: b')])).toBe('minor');
  });

  it('is patch for fixes only', () => {
    expect(bumpFor([commit('fix: a'), commit('docs: b')])).toBe('patch');
  });

  it('is patch, not none, for commits that fit no category', () => {
    // Shipping a build whose version did not move is worse than moving the patch number
    // for a documentation change.
    expect(bumpFor([commit('chore: tidy up')])).toBe('patch');
  });
});

describe('release notes', () => {
  const commits = [
    parseCommit('a', 'feat(sos): let the countdown be cancelled'),
    parseCommit('b', 'fix(sync): keep queued alerts across a restart'),
    parseCommit('c', 'security(auth): reject tokens with no algorithm'),
    parseCommit('d', 'chore(ci): cache gradle'),
    parseCommit('e', 'refactor(domain): extract the claim lease'),
    parseCommit('f', 'test(sos): cover late cancellation'),
  ];

  it('groups by category under readable headings', () => {
    const notes = releaseNotes(commits);
    expect(notes).toContain('New');
    expect(notes).toContain('let the countdown be cancelled');
    expect(notes).toContain('Fixed');
    expect(notes).toContain('Security');
  });

  it('leaves out changes a user cannot perceive', () => {
    const notes = releaseNotes(commits);
    // Real work, and it belongs in the changelog rather than in the text somebody reads
    // while deciding whether to update. Store reviewers reject obvious commit dumps.
    expect(notes).not.toContain('cache gradle');
    expect(notes).not.toContain('extract the claim lease');
    expect(notes).not.toContain('cover late cancellation');
  });

  it('puts breaking changes first, under their own heading', () => {
    const notes = releaseNotes([
      parseCommit('a', 'fix: something small'),
      parseCommit('b', 'feat(api)!: sign-in now requires a verified email'),
    ]);
    expect(notes.indexOf('Important changes')).toBe(0);
    expect(notes).toContain('sign-in now requires a verified email');
  });

  it('falls back to something publishable when nothing user-visible changed', () => {
    // A store listing cannot have empty release notes.
    expect(releaseNotes([parseCommit('a', 'chore: bump dependencies')])).toBe(
      'Stability and maintenance improvements.',
    );
  });

  it('produces nothing that looks like a commit dump', () => {
    const notes = releaseNotes(commits);
    expect(notes).not.toMatch(/^[0-9a-f]{7}/m);
    expect(notes).not.toContain('feat(');
  });
});

describe('build numbers', () => {
  it('is the commit count', () => {
    expect(buildNumber(1234)).toBe(1234);
  });

  it('applies an offset for a project migrating into this scheme', () => {
    // Without it, the first build under the new scheme goes backwards and the store
    // refuses it.
    expect(buildNumber(50, 1000)).toBe(1050);
  });

  it('rejects a nonsensical count rather than producing a nonsensical build', () => {
    expect(() => buildNumber(-1)).toThrow();
    expect(() => buildNumber(1.5)).toThrow();
  });

  it('is monotonic as commits accumulate', () => {
    const numbers = [10, 11, 12, 100].map((count) => buildNumber(count, 500));
    for (let i = 1; i < numbers.length; i += 1) {
      expect(numbers[i]!).toBeGreaterThan(numbers[i - 1]!);
    }
  });
});

describe('release validation', () => {
  const v = (tag: string) => parseVersion(tag)!;

  it('accepts a release that moves forward on both counts', () => {
    const result = validateRelease({
      previousVersion: v('1.2.3'),
      nextVersion: v('1.3.0'),
      previousBuildNumber: 100,
      nextBuildNumber: 101,
    });
    expect(result.ok).toBe(true);
  });

  it('refuses a version that goes backwards', () => {
    const result = validateRelease({
      previousVersion: v('1.3.0'),
      nextVersion: v('1.2.9'),
      previousBuildNumber: 100,
      nextBuildNumber: 101,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain('not ahead');
  });

  it('refuses an unchanged version', () => {
    const result = validateRelease({
      previousVersion: v('1.2.3'),
      nextVersion: v('1.2.3'),
      previousBuildNumber: 100,
      nextBuildNumber: 101,
    });
    expect(result.ok).toBe(false);
  });

  it('refuses a reused build number, which both stores reject', () => {
    const result = validateRelease({
      previousVersion: v('1.2.3'),
      nextVersion: v('1.3.0'),
      previousBuildNumber: 100,
      nextBuildNumber: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain('Build number');
  });

  it('catches a hotfix branched from the wrong place', () => {
    // 1.2.4 branched from 1.2.3 after 1.3.0 shipped. Both stores would reject it, twenty
    // minutes into a build, at the point where somebody is already stressed.
    const result = validateRelease({
      previousVersion: v('1.3.0'),
      nextVersion: v('1.2.4'),
      previousBuildNumber: 200,
      nextBuildNumber: 201,
    });
    expect(result.ok).toBe(false);
  });
});

describe('a whole release, end to end', () => {
  it('derives the next version, build number and notes from a tag and some commits', () => {
    const lastTag = parseVersion('v1.4.2')!;
    const commits = [
      parseCommit('a1', 'feat(widget): show session status on the home screen'),
      parseCommit('a2', 'fix(location): stop dropping the first fix after a permission change'),
      parseCommit('a3', 'chore: update dependencies'),
    ];

    const next = bump(lastTag, bumpFor(commits));
    const build = buildNumber(1_337, 0);

    expect(formatVersion(next)).toBe('1.5.0');
    expect(build).toBe(1_337);

    const validation = validateRelease({
      previousVersion: lastTag,
      nextVersion: next,
      previousBuildNumber: 1_300,
      nextBuildNumber: build,
    });
    expect(validation.ok).toBe(true);

    const notes = releaseNotes(commits);
    expect(notes).toContain('show session status on the home screen');
    expect(notes).not.toContain('update dependencies');
  });
});
