import shouldIngestGame from '../../src/ingestion/ingestionGate';

const baseDoc = {
  title: 'Test Game',
  imageUrl: 'https://example.com/image.jpg',
};

describe('ingestionGate', () => {
  describe('desktop-only platform exclusion', () => {
    it.each([
      [['pc'], false],
      [['mac'], false],
      [['web'], false],
      [['pc', 'mac'], false],
      [['pc', 'web'], false],
      [['mac', 'web'], false],
      [['pc', 'mac', 'web'], false],
      [['pc', 'ps5'], true],
      [['xbox-one'], true],
      [['switch'], true],
    ])(
      'platforms %j → allowed=%s',
      (platforms, allowed) => {
        const res = shouldIngestGame(
          {
            ...baseDoc,
            parentPlatforms: platforms as string[],
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
  });

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

    it('allows when platformsDetailed is present', () => {
      const res = shouldIngestGame(
        {
          ...baseDoc,
          platformsDetailed: [{ slug: 'ps5' }],
        },
        {}
      );

      expect(res.allowed).toBe(true);
    });
  });

  describe('image requirement', () => {
    it('rejects when imageUrl is missing', () => {
      const res = shouldIngestGame(
        {
          title: 'No Image',
          parentPlatforms: ['ps5'],
        },
        {}
      );

      expect(res).toEqual({
        allowed: false,
        reason: 'no_image',
      });
    });
  });

  describe('non-latin title guard', () => {
    it('rejects titles that are mostly non-latin', () => {
      const res = shouldIngestGame(
        {
          title: '只有文字的恐怖遊戲測試測試測試',
          imageUrl: 'https://example.com/image.jpg',
          parentPlatforms: ['ps5'],
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
          parentPlatforms: ['ps5'],
        },
        {}
      );

      expect(res.allowed).toBe(true);
    });
  });
});
