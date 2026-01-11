import shouldIngestGame from '../../src/ingestion/ingestionGate';

const baseDoc = {
  title: 'Test Game',
  imageUrl: 'https://example.com/image.jpg',
};

describe('ingestionGate', () => {
  /* ---------------------------------------------------
     Non-latin title guard
  --------------------------------------------------- */

  describe('non-latin title guard', () => {
    it('rejects titles that are mostly non-latin', () => {
      const res = shouldIngestGame(
        {
          title: '只有文字的恐怖遊戲測試測試測試',
          imageUrl: 'https://example.com/image.jpg',
          parentPlatforms: ['playstation'],
        },
        {}
      );

      expect(res).toEqual({
        allowed: false,
        reason: 'non_latin_title',
      });
    });

    it('allows mixed or mostly latin titles', () => {
      const res = shouldIngestGame(
        {
          title: 'Resident Evil 漢字',
          imageUrl: 'https://example.com/image.jpg',
          parentPlatforms: ['playstation'],
        },
        {}
      );

      expect(res.allowed).toBe(true);
    });
  });

  /* ---------------------------------------------------
     Platform presence requirement
  --------------------------------------------------- */

  describe('platform presence requirement', () => {
    it('rejects when no parentPlatforms and no platformsDetailed', () => {
      const res = shouldIngestGame(
        {
          title: 'No Platforms',
          imageUrl: 'https://example.com/image.jpg',
        },
        {}
      );

      expect(res).toEqual({
        allowed: false,
        reason: 'no_parent_platforms',
      });
    });

    it('allows when only parentPlatforms are present', () => {
      const res = shouldIngestGame(
        {
          ...baseDoc,
          parentPlatforms: ['playstation'],
        },
        {}
      );

      expect(res.allowed).toBe(true);
    });

    it('allows when only platformsDetailed are present', () => {
      const res = shouldIngestGame(
        {
          ...baseDoc,
          platformsDetailed: [{ slug: 'playstation' }],
        },
        {}
      );

      expect(res.allowed).toBe(true);
    });
  });

  /* ---------------------------------------------------
     Image requirement
  --------------------------------------------------- */

  describe('image requirement', () => {
    it('rejects when imageUrl is missing', () => {
      const res = shouldIngestGame(
        {
          title: 'No Image',
          parentPlatforms: ['playstation'],
        },
        {}
      );

      expect(res).toEqual({
        allowed: false,
        reason: 'no_image',
      });
    });
  });

  /* ---------------------------------------------------
     Platform hygiene (desktop-only exclusion)
  --------------------------------------------------- */

  describe('platform hygiene', () => {
    it.each([
      [['pc'], false],
      [['mac'], false],
      [['web'], false],
      [['pc', 'mac'], false],
      [['pc', 'web'], false],
      [['mac', 'web'], false],
      [['pc', 'mac', 'web'], false],

      [['playstation'], true],
      [['xbox'], true],
      [['nintendo'], true],
      [['pc', 'playstation'], true],
      [['web', 'xbox'], true],
    ])(
      'parentPlatforms %j → allowed=%s',
      (parentPlatforms, allowed) => {
        const res = shouldIngestGame(
          {
            ...baseDoc,
            parentPlatforms: parentPlatforms as string[],
          },
          {}
        );

        expect(res.allowed).toBe(allowed);

        if (!allowed) {
          expect(res).toEqual({
            allowed: false,
            reason: 'platform_excluded',
          });
        }
      }
    );

    it('allows console via platformsDetailed even if parentPlatforms are desktop-only', () => {
      const res = shouldIngestGame(
        {
          ...baseDoc,
          parentPlatforms: ['pc'],
          platformsDetailed: [{ slug: 'playstation' }],
        },
        {}
      );

      expect(res.allowed).toBe(true);
    });

    it('rejects if platformsDetailed are desktop-only', () => {
      const res = shouldIngestGame(
        {
          ...baseDoc,
          platformsDetailed: [{ slug: 'pc' }],
        },
        {}
      );

      expect(res).toEqual({
        allowed: false,
        reason: 'platform_excluded',
      });
    });
  });
});
