export type { ScanResult, ScanSource } from './types';
export { analyzePhoto, classifyByRecyclingCode, selectMaterialManually } from './pipeline';
export {
  MODEL_CONFIDENCE_THRESHOLD,
  MODEL_INPUT_SIZE,
  MODEL_LABELS,
  MODEL_TEMPERATURE,
  calibrateProbabilities,
  estimateFromPhoto,
  photoToModelInput,
  verdictFromProbabilities,
  type ModelLabel,
  type VisualVerdict,
} from './visualClassifier';
export { decodePng, inflateRaw, type DecodedImage } from './pngDecode';
export { DISPOSAL_TIPS_ID, SCAN_POINTS_HINT } from './disposal-tips';
