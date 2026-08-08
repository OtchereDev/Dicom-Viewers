import makeVoiLutModuleProvider from './voiLutModuleProvider';

jest.mock('@cornerstonejs/core', () => ({
  Enums: {
    VOILUTFunctionType: {
      LINEAR: 'LINEAR',
      SAMPLED_SIGMOID: 'SIGMOID',
      LINEAR_EXACT: 'LINEAR_EXACT',
    },
  },
}));

const makeProvider = voiLutModule =>
  makeVoiLutModuleProvider({ get: jest.fn().mockReturnValue(voiLutModule) });

const baseModule = { windowCenter: [2048], windowWidth: [4096] };

describe('voiLutModuleProvider', () => {
  it('should wrap a string voiLUTFunction in an array', () => {
    const provider = makeProvider({ ...baseModule, voiLUTFunction: 'LINEAR' });
    expect(provider('voiLutModule', 'imageId')).toEqual({
      ...baseModule,
      voiLUTFunction: ['LINEAR'],
    });
  });

  it('should wrap SIGMOID, which DX and CR routinely send', () => {
    const provider = makeProvider({ ...baseModule, voiLUTFunction: 'SIGMOID' });
    expect(provider('voiLutModule', 'imageId')).toEqual({
      ...baseModule,
      voiLUTFunction: ['SIGMOID'],
    });
  });

  it('should trim and upper case padded values', () => {
    const provider = makeProvider({ ...baseModule, voiLUTFunction: ' linear_exact ' });
    expect(provider('voiLutModule', 'imageId')).toEqual({
      ...baseModule,
      voiLUTFunction: ['LINEAR_EXACT'],
    });
  });

  it('should drop unrecognized functions so cornerstone falls back to LINEAR', () => {
    const provider = makeProvider({ ...baseModule, voiLUTFunction: 'NOT_A_FUNCTION' });
    expect(provider('voiLutModule', 'imageId')).toEqual(baseModule);
  });

  it('should leave a module without a voiLUTFunction untouched', () => {
    const provider = makeProvider(baseModule);
    expect(provider('voiLutModule', 'imageId')).toEqual(baseModule);
  });

  it('should leave an already-arrayed voiLUTFunction untouched', () => {
    const voiLutModule = { ...baseModule, voiLUTFunction: ['LINEAR'] };
    const provider = makeProvider(voiLutModule);
    expect(provider('voiLutModule', 'imageId')).toEqual(voiLutModule);
  });

  it('should return undefined when the underlying provider has nothing', () => {
    const provider = makeProvider(undefined);
    expect(provider('voiLutModule', 'imageId')).toBeUndefined();
  });

  it('should ignore other metadata modules', () => {
    const get = jest.fn();
    const provider = makeVoiLutModuleProvider({ get });
    expect(provider('imagePixelModule', 'imageId')).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });

  it('should ignore array queries', () => {
    const get = jest.fn();
    const provider = makeVoiLutModuleProvider({ get });
    expect(provider('voiLutModule', ['imageId'])).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });
});
