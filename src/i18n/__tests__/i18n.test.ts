import i18n, { SUPPORTED_LANGUAGES, resources } from '../index';

describe('Internationalization (i18n)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('should define supported languages correctly', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(3);
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('es');
  });

  it('should have complete translation keys in all locales', () => {
    const enKeys = Object.keys(resources.en.translation);
    const hiKeys = Object.keys(resources.hi.translation);
    const esKeys = Object.keys(resources.es.translation);

    expect(hiKeys).toEqual(enKeys);
    expect(esKeys).toEqual(enKeys);

    for (const namespace of enKeys as Array<keyof typeof resources.en.translation>) {
      const enSubKeys = Object.keys(resources.en.translation[namespace]);
      const hiSubKeys = Object.keys(resources.hi.translation[namespace]);
      const esSubKeys = Object.keys(resources.es.translation[namespace]);

      expect(hiSubKeys).toEqual(enSubKeys);
      expect(esSubKeys).toEqual(enSubKeys);
    }
  });

  it('should translate correctly in English by default', () => {
    expect(i18n.t('common.save')).toBe('Save');
    expect(i18n.t('nav.home')).toBe('Home');
    expect(i18n.t('profile.title')).toBe('Profile');
    expect(i18n.t('profile.language')).toBe('Language');
    expect(i18n.t('wallet.balance')).toBe('Eco Balance');
    expect(i18n.t('carbon.todayFootprint')).toBe("Today's Footprint");
  });

  it('should change language to Hindi and translate strings correctly', async () => {
    await i18n.changeLanguage('hi');
    expect(i18n.language).toBe('hi');
    expect(i18n.t('common.save')).toBe('सहेजें');
    expect(i18n.t('nav.home')).toBe('होम');
    expect(i18n.t('profile.title')).toBe('प्रोफ़ाइल');
    expect(i18n.t('profile.language')).toBe('भाषा');
    expect(i18n.t('wallet.balance')).toBe('इको बैलेंस');
    expect(i18n.t('carbon.todayFootprint')).toBe('आज का कार्बन फुटप्रिंट');
  });

  it('should change language to Spanish and translate strings correctly', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');
    expect(i18n.t('common.save')).toBe('Guardar');
    expect(i18n.t('nav.home')).toBe('Inicio');
    expect(i18n.t('profile.title')).toBe('Perfil');
    expect(i18n.t('profile.language')).toBe('Idioma');
    expect(i18n.t('wallet.balance')).toBe('Saldo Ecológico');
    expect(i18n.t('carbon.todayFootprint')).toBe('Huella de Hoy');
  });

  it('should fall back to English if a key is queried on an unconfigured language', async () => {
    await i18n.changeLanguage('fr' as any);
    expect(i18n.t('common.save')).toBe('Save');
  });
});
