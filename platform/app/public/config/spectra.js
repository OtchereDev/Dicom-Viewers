/** @type {AppTypes.Config} */
// Production Spectra deployment config — used by `pnpm build:spectra`.
//
// The DICOMweb roots below are RELATIVE, which assumes the viewer is served
// behind the same host/reverse-proxy as the PACS (i.e. `/dicomweb` resolves to
// the DICOMweb endpoint). If that is not how Spectra is deployed, replace them
// with absolute URLs to your DICOMweb server before building.
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

  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Spectra PACS',
        name: 'DCM4CHEE',
        // TODO(deployment): point these at the Spectra DICOMweb endpoint if the
        // viewer is not proxied onto the same origin as the PACS.
        wadoUriRoot: '/dicomweb',
        qidoRoot: '/dicomweb',
        wadoRoot: '/dicomweb',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
        bulkDataURI: {
          enabled: true,
        },
      },
    },
    {
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
