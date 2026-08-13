'use strict';

/**
 * Yaygin CI saglayicilarinin set ettigi env degiskenlerine bakarak CI ortaminda
 * calisilip calisilmadigini tahmin eder. postinstall CI'da scaffold'u atlar;
 * cunku CI kosularinda .memory/ dosyalarinin olusturulmasi/degistirilmesi
 * genellikle istenmez ve bazi CI'lar postinstall'i kismi/izole dosya sistemiyle calistirir.
 */
function isCI() {
  return Boolean(
    process.env.CI ||
      process.env.CONTINUOUS_INTEGRATION ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.BUILDKITE ||
      process.env.JENKINS_URL ||
      process.env.TEAMCITY_VERSION
  );
}

module.exports = { isCI };
