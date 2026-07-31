/** @type {AppTypes.Config} */
// Spectra branding against a PUBLIC static-WADO server — no local PACS needed.
// Use this to check theming/branding locally: `pnpm dev:spectra`.
// Requires internet access; serves OHIF's public sample studies read-only.
window.config = {
  routerBasename: null,
  extensions: [],
  modes: [],
  showStudyList: true,
  maxNumberOfWebWorkers: 4,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,

  // Mounts the theme provider; without it `theme` below is inert.
  customizationService: ['@ohif/extension-default.customizationModule.theme'],

  // Facility theming. Swap `default` for another preset name, or define a new
  // preset inline under `presets` to brand a different facility without a code
  // change. See platform/ui-next/src/themes for the shipped presets.
  theme: {
    default: 'spectra',
  },

  defaultDataSourceName: 'ohif',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'ohif',
      configuration: {
        friendlyName: 'Public sample studies (static WADO)',
        name: 'aws',
        wadoUriRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        qidoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        wadoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video,pdf',
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
      },
    },
    {
      // Drag-and-drop local DICOM files, so the viewer is usable fully offline.
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],

  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement(
        'a',
        {
          target: '_self',
          rel: 'noopener noreferrer',
          href: '/',
        },
        React.createElement('img', {
          src: './assets/spectra-light.png',
          className: 'h-10 w-44',
        })
      );
    },
  },
};
