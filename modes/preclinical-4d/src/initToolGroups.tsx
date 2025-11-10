const toolGroupIds = {
  default: 'dynamic4D-default',
  PT: 'dynamic4D-pt',
  Fusion: 'dynamic4D-fusion',
  CT: 'dynamic4D-ct',
};

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

function _initToolGroups(toolNames, Enums, toolGroupService, commandsManager, servicesManager) {
  const { cornerstoneViewportService } = servicesManager.services;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isReferringDoctor = window.ROLE_RESTRICTIONS?.isReferringDoctor || false;

  // Diagnostic and segmentation tools restricted for referring doctors
  const diagnosticTools = [
    toolNames.Length,
    toolNames.SegmentBidirectional,
    toolNames.ArrowAnnotate,
    toolNames.Bidirectional,
    toolNames.Probe,
    toolNames.EllipticalROI,
    toolNames.RectangleROI,
    toolNames.RectangleROIThreshold,
  ];

  const segmentationTools = [
    'CircularBrush',
    'CircularEraser',
    'SphereBrush',
    'SphereEraser',
    'ThresholdCircularBrush',
    'ThresholdSphereBrush',
    toolNames.RectangleScissors,
    toolNames.PaintFill,
    toolNames.CircleScissors,
    toolNames.SphereScissors,
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
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
      },
      {
        toolName: toolNames.StackScroll,
        bindings: isMobile
          ? [{ mouseButton: Enums.MouseBindings.Primary }]
          : [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
      },
    ],
    passive: [
      { toolName: toolNames.Length },
      { toolName: toolNames.SegmentBidirectional },
      { toolName: toolNames.ArrowAnnotate },
      { toolName: toolNames.Bidirectional },
      { toolName: toolNames.Probe },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.RectangleROIThreshold },
      { toolName: toolNames.RectangleScissors },
      { toolName: toolNames.PaintFill },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Magnify },
      {
        toolName: 'CircularBrush',
        parentTool: 'Brush',
        configuration: {
          activeStrategy: 'FILL_INSIDE_CIRCLE',
          brushSize: 7,
        },
      },
      {
        toolName: 'CircularEraser',
        parentTool: 'Brush',
        configuration: {
          activeStrategy: 'ERASE_INSIDE_CIRCLE',
          brushSize: 7,
        },
      },
      {
        toolName: 'SphereBrush',
        parentTool: 'Brush',
        configuration: {
          activeStrategy: 'FILL_INSIDE_SPHERE',
          brushSize: 7,
        },
      },
      {
        toolName: 'SphereEraser',
        parentTool: 'Brush',
        configuration: {
          activeStrategy: 'ERASE_INSIDE_SPHERE',
          brushSize: 7,
        },
      },
      {
        toolName: 'ThresholdCircularBrush',
        parentTool: 'Brush',
        configuration: {
          activeStrategy: 'THRESHOLD_INSIDE_CIRCLE',
          brushSize: 7,
        },
      },
      {
        toolName: 'ThresholdSphereBrush',
        parentTool: 'Brush',
        configuration: {
          activeStrategy: 'THRESHOLD_INSIDE_SPHERE',
          brushSize: 7,
        },
      },
      { toolName: toolNames.CircleScissors },
      { toolName: toolNames.RectangleScissors },
      { toolName: toolNames.SphereScissors },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Magnify },
    ],
    enabled: [],
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
    ],
  };

  // If referring doctor, disable diagnostic and segmentation tools
  if (isReferringDoctor) {
    const toolsToDisable = [];
    const allRestrictedTools = [...diagnosticTools, ...segmentationTools];

    tools.passive = tools.passive.filter(tool => {
      const toolNameToCheck = tool.toolName || tool;
      const isRestricted = allRestrictedTools.includes(toolNameToCheck);

      if (isRestricted) {
        toolsToDisable.push(tool);
        return false;
      }
      return true;
    });

    tools.disabled = [...tools.disabled, ...toolsToDisable];
  }

  toolGroupService.createToolGroupAndAddTools(toolGroupIds.PT, {
    ...tools,
    passive: isReferringDoctor
      ? tools.passive
      : [...tools.passive, { toolName: 'RectangleROIStartEndThreshold' }],
  });
  toolGroupService.createToolGroupAndAddTools(toolGroupIds.CT, {
    ...tools,
    passive: isReferringDoctor
      ? tools.passive
      : [...tools.passive, { toolName: 'RectangleROIStartEndThreshold' }],
  });
  toolGroupService.createToolGroupAndAddTools(toolGroupIds.Fusion, {
    ...tools,
    passive: isReferringDoctor
      ? tools.passive
      : [...tools.passive, { toolName: 'RectangleROIStartEndThreshold' }],
  });
  toolGroupService.createToolGroupAndAddTools(toolGroupIds.default, tools);
}

function initToolGroups({ toolNames, Enums, toolGroupService, commandsManager, servicesManager }) {
  _initToolGroups(toolNames, Enums, toolGroupService, commandsManager, servicesManager);
}

export { initToolGroups as default, toolGroupIds };
