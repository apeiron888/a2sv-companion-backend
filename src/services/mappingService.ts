import { ProblemMappingModel } from "../models/problemMapping.js";

export async function resolveMapping(problemUrl: string) {
  const mapping = await ProblemMappingModel.findOne({ problemUrl });
  return mapping;
}
