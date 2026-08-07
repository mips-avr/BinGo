export type { ScanResult, ScanSource } from './types';
export { analyzePhoto, classifyByRecyclingCode, selectMaterialManually } from './pipeline';
export {
  MIN_VISUAL_EVIDENCE,
  VISUAL_CONFIDENCE_THRESHOLD,
  computeFeatures,
  estimateFromPhoto,
  extractFeatures,
  pickBest,
  rgbToHsl,
  scoreMaterials,
  type ImageFeatures,
  type VisualVerdict,
} from './visualClassifier';
export { decodePng, inflateRaw, type DecodedImage } from './pngDecode';
export { DISPOSAL_TIPS_ID, SCAN_POINTS_HINT } from './disposal-tips';
