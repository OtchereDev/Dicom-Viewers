import { toolNames as SRToolNames } from '@ohif/extension-cornerstone-dicom-sr';

const colours = {
  'viewport-0': 'rgb(200, 0, 0)',
  'viewport-1': 'rgb(200, 200, 0)',
  'viewport-2': 'rgb(0, 200, 0)',
};

const colorsByOrientation = {
  axial: 'rgb(200, 0, 0)',
  sagittal: 'rgb(200, 200, 0)',
  coronal: 'rgb(0, 200, 0)',
};

function initDefaultToolGroup(extensionManager, toolGroupService, commandsManager, toolGroupId) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames, Enums } = utilityModule.exports;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isReferringDoctor = window.ROLE_RESTRICTIONS?.isReferringDoctor || false;

  // Diagnostic tools restricted for referring doctors
  const diagnosticTools = [
    toolNames.UltrasoundAnnotation,
    toolNames.Length,
    toolNames.ArrowAnnotate,
    toolNames.SegmentBidirectional,
    toolNames.Bidirectional,
    toolNames.DragProbe,
    toolNames.Probe,
    toolNames.EllipticalROI,
    toolNames.CircleROI,
    toolNames.RectangleROI,
    toolNames.Angle,
    toolNames.CobbAngle,
    toolNames.CalibrationLine,
    toolNames.PlanarFreehandContourSegmentation,
    toolNames.UltrasoundDirectional,
    toolNames.PlanarFreehandROI,
    toolNames.SplineROI,
    toolNames.LivewireContour,
  ];

  const tools = {
    active: [
      {
        toolName: isReferringDoctor ? toolNames.WindowLevel : toolNames.UltrasoundAnnotation,
        bindings: isMobile
          ? [{ numTouchPoints: 2 }]
          : [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      {
        toolName: toolNames.StackScroll,
        bindings: isMobile
          ? [{ mouseButton: Enums.MouseBindings.Primary }]
          : [{ mouseButton: Enums.MouseBindings.Wheel }],
      },
    ],
    passive: [
      { toolName: toolNames.Length },
      {
        toolName: toolNames.ArrowAnnotate,
        configuration: {
          getTextCallback: (callback, eventDetails) => {
            commandsManager.runCommand('arrowTextCallback', {
              callback,
              eventDetails,
            });
          },
          changeTextCallback: (data, eventDetails, callback) => {
            commandsManager.runCommand('arrowTextCallback', {
              callback,
              data,
              eventDetails,
            });
          },
        },
      },
      {
        toolName: toolNames.SegmentBidirectional,
      },
      { toolName: toolNames.Bidirectional },
      { toolName: toolNames.DragProbe },
      { toolName: toolNames.Probe },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.CircleROI },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Angle },
      { toolName: toolNames.CobbAngle },
      { toolName: toolNames.Magnify },
      { toolName: toolNames.CalibrationLine },
      {
        toolName: toolNames.PlanarFreehandContourSegmentation,
        configuration: {
          displayOnePointAsCrosshairs: true,
        },
      },
      { toolName: toolNames.UltrasoundDirectional },
      { toolName: toolNames.WindowLevel },
      { toolName: toolNames.PlanarFreehandROI },
      { toolName: toolNames.SplineROI },
      { toolName: toolNames.LivewireContour },
      { toolName: toolNames.WindowLevelRegion },
    ],
    enabled: [{ toolName: toolNames.ImageOverlayViewer }, { toolName: toolNames.ReferenceLines }],
    disabled: [
      {
        toolName: toolNames.AdvancedMagnify,
      },
    ],
  };

  // If referring doctor, disable diagnostic tools
  if (isReferringDoctor) {
    const toolsToDisable = [];

    // Filter out diagnostic tools from passive array
    tools.passive = tools.passive.filter(tool => {
      const toolNameToCheck = tool.toolName || tool;
      const isDiagnostic = diagnosticTools.includes(toolNameToCheck);

      if (isDiagnostic) {
        toolsToDisable.push(tool);
        return false;
      }
      return true;
    });

    // Add disabled tools
    tools.disabled = [...tools.disabled, ...toolsToDisable];
  }

  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

function initSRToolGroup(extensionManager, toolGroupService) {
  const SRUtilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone-dicom-sr.utilityModule.tools'
  );

  if (!SRUtilityModule) {
    return;
  }

  const CS3DUtilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames: SRToolNames } = SRUtilityModule.exports;
  const { toolNames, Enums } = CS3DUtilityModule.exports;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isReferringDoctor = window.ROLE_RESTRICTIONS?.isReferringDoctor || false;

  // SR measurement tools restricted for referring doctors
  const srDiagnosticTools = [
    SRToolNames.SRLength,
    SRToolNames.SRArrowAnnotate,
    SRToolNames.SRBidirectional,
    SRToolNames.SREllipticalROI,
    SRToolNames.SRCircleROI,
    SRToolNames.SRPlanarFreehandROI,
    SRToolNames.SRRectangleROI,
  ];

  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: isMobile
          ? [{ numTouchPoints: 2 }]
          : [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      {
        toolName: toolNames.StackScroll,
        bindings: isMobile
          ? [{ mouseButton: Enums.MouseBindings.Primary }]
          : [{ mouseButton: Enums.MouseBindings.Wheel }],
      },
    ],
    passive: [
      { toolName: SRToolNames.SRLength },
      { toolName: SRToolNames.SRArrowAnnotate },
      { toolName: SRToolNames.SRBidirectional },
      { toolName: SRToolNames.SREllipticalROI },
      { toolName: SRToolNames.SRCircleROI },
      { toolName: SRToolNames.SRPlanarFreehandROI },
      { toolName: SRToolNames.SRRectangleROI },
      { toolName: toolNames.WindowLevelRegion },
    ],
    enabled: [
      {
        toolName: SRToolNames.DICOMSRDisplay,
      },
    ],
    disabled: [],
  };

  // If referring doctor, disable SR diagnostic tools
  if (isReferringDoctor) {
    const toolsToDisable = [];

    tools.passive = tools.passive.filter(tool => {
      const toolNameToCheck = tool.toolName || tool;
      const isDiagnostic = srDiagnosticTools.includes(toolNameToCheck);

      if (isDiagnostic) {
        toolsToDisable.push(tool);
        return false;
      }
      return true;
    });

    tools.disabled = [...tools.disabled, ...toolsToDisable];
  }

  const toolGroupId = 'SRToolGroup';
  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

function initMPRToolGroup(extensionManager, toolGroupService, commandsManager) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const serviceManager = extensionManager._servicesManager;
  const { cornerstoneViewportService } = serviceManager.services;
  const { toolNames, Enums } = utilityModule.exports;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isReferringDoctor = window.ROLE_RESTRICTIONS?.isReferringDoctor || false;

  const diagnosticTools = [
    toolNames.Length,
    toolNames.ArrowAnnotate,
    toolNames.Bidirectional,
    toolNames.DragProbe,
    toolNames.Probe,
    toolNames.EllipticalROI,
    toolNames.CircleROI,
    toolNames.RectangleROI,
    toolNames.Angle,
    toolNames.CobbAngle,
    toolNames.PlanarFreehandROI,
    toolNames.SplineROI,
    toolNames.LivewireContour,
    toolNames.PlanarFreehandContourSegmentation,
  ];

  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: isMobile
          ? [{ numTouchPoints: 2 }]
          : [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      {
        toolName: toolNames.StackScroll,
        bindings: isMobile
          ? [{ mouseButton: Enums.MouseBindings.Primary }]
          : [{ mouseButton: Enums.MouseBindings.Wheel }],
      },
    ],
    passive: [
      { toolName: toolNames.Length },
      {
        toolName: toolNames.ArrowAnnotate,
        configuration: {
          getTextCallback: (callback, eventDetails) => {
            commandsManager.runCommand('arrowTextCallback', {
              callback,
              eventDetails,
            });
          },
          changeTextCallback: (data, eventDetails, callback) => {
            commandsManager.runCommand('arrowTextCallback', {
              callback,
              data,
              eventDetails,
            });
          },
        },
      },
      { toolName: toolNames.Bidirectional },
      { toolName: toolNames.DragProbe },
      { toolName: toolNames.Probe },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.CircleROI },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Angle },
      { toolName: toolNames.CobbAngle },
      { toolName: toolNames.PlanarFreehandROI },
      { toolName: toolNames.SplineROI },
      { toolName: toolNames.LivewireContour },
      { toolName: toolNames.WindowLevelRegion },
      {
        toolName: toolNames.PlanarFreehandContourSegmentation,
        configuration: {
          displayOnePointAsCrosshairs: true,
        },
      },
    ],
    disabled: [
      {
        toolName: toolNames.Crosshairs,
        configuration: {
          viewportIndicators: true,
          viewportIndicatorsConfig: {
            circleRadius: 5,
            xOffset: 0.95,
            yOffset: 0.05,
          },
          disableOnPassive: true,
          autoPan: {
            enabled: false,
            panSize: 10,
          },
          getReferenceLineColor: viewportId => {
            const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
            const viewportOptions = viewportInfo?.viewportOptions;

            if (viewportOptions) {
              return (
                colours[viewportOptions.id] ||
                colorsByOrientation[viewportOptions.orientation] ||
                '#0c0'
              );
            } else {
              console.warn('missing viewport?', viewportId);
              return '#0c0';
            }
          },
        },
      },
      {
        toolName: toolNames.AdvancedMagnify,
      },
      { toolName: toolNames.ReferenceLines },
    ],
  };

  // If referring doctor, disable diagnostic tools
  if (isReferringDoctor) {
    const toolsToDisable = [];

    tools.passive = tools.passive.filter(tool => {
      const toolNameToCheck = tool.toolName || tool;
      const isDiagnostic = diagnosticTools.includes(toolNameToCheck);

      if (isDiagnostic) {
        toolsToDisable.push(tool);
        return false;
      }
      return true;
    });

    tools.disabled = [...tools.disabled, ...toolsToDisable];
  }

  toolGroupService.createToolGroupAndAddTools('mpr', tools);
}

function initVolume3DToolGroup(extensionManager, toolGroupService) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames, Enums } = utilityModule.exports;

  const tools = {
    active: [
      {
        toolName: toolNames.TrackballRotateTool,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
    ],
  };

  toolGroupService.createToolGroupAndAddTools('volume3d', tools);
}

function initToolGroups(extensionManager, toolGroupService, commandsManager) {
  initDefaultToolGroup(extensionManager, toolGroupService, commandsManager, 'default');
  initSRToolGroup(extensionManager, toolGroupService);
  initMPRToolGroup(extensionManager, toolGroupService, commandsManager);
  initVolume3DToolGroup(extensionManager, toolGroupService);
}

export default initToolGroups;
