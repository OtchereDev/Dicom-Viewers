import { Enums } from '@cornerstonejs/core';

const VALID_VOI_LUT_FUNCTIONS = new Set<string>(Object.values(Enums.VOILUTFunctionType));

type VoiLutModule = Record<string, unknown>;

interface MetadataProvider {
  get: (type: string, query: string) => VoiLutModule | undefined;
}

/**
 * Normalizes the `voiLutModule` so that `voiLUTFunction` is shaped the way
 * `@cornerstonejs/dicom-image-loader` expects it.
 *
 * `createImage` reads the function as `voiLUTFunction[0]`, matching the array
 * shape it already gets for `windowCenter`/`windowWidth`. VOILUTFunction
 * (0028,1056) is VR CS with VM 1 though, so it naturalizes to a bare string and
 * the index yields a single character: "LINEAR" becomes "L". That value reaches
 * `toLowHighRange`, matches none of the known functions, and throws
 * "Invalid VOI LUT function", taking down the whole viewer route. Studies that
 * omit the tag are unaffected, which is why this only shows up on modalities
 * that routinely write it (DX, CR, MG).
 *
 * Values that aren't a recognized VOI LUT function are dropped rather than
 * passed along, so cornerstone falls back to its LINEAR default instead of
 * throwing.
 */
function makeVoiLutModuleProvider(metadataProvider: MetadataProvider) {
  return (type: string, query: string | string[]) => {
    if (type !== 'voiLutModule' || Array.isArray(query)) {
      return;
    }

    const voiLutModule = metadataProvider.get(type, query);

    if (!voiLutModule) {
      return voiLutModule;
    }

    const { voiLUTFunction } = voiLutModule;

    if (typeof voiLUTFunction !== 'string') {
      // Tag absent, or already an array; nothing to normalize.
      return voiLutModule;
    }

    const normalized = voiLUTFunction.trim().toUpperCase();

    if (!VALID_VOI_LUT_FUNCTIONS.has(normalized)) {
      const rest = { ...voiLutModule };
      delete rest.voiLUTFunction;
      return rest;
    }

    return { ...voiLutModule, voiLUTFunction: [normalized] };
  };
}

export default makeVoiLutModuleProvider;
