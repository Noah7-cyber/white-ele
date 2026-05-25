import { CustomValidator } from "express-validator";
import { AppDataSource } from "../../core/config/database";
import { State } from "../entities/State";

/**
 * Custom validator to check if a state with the given code exists
 */
export const stateCodeExists: CustomValidator = async (value: string) => {
  if (!value) return true; // allow empty; use .optional() in chain

  const stateRepository = AppDataSource.getRepository(State);
  const state = await stateRepository.findOne({
    where: { code: value.toUpperCase() },
  });

  if (!state) {
    throw new Error(`State with code '${value.toUpperCase()}' does not exist.`);
  }

  return true;
};

/**
 * Custom validator to check if a state with the given name exists
 */
export const stateNameExists: CustomValidator = async (value: string) => {
  if (!value) return true; // allow empty; use .optional() in chain

  const stateRepository = AppDataSource.getRepository(State);
  const state = await stateRepository.findOne({
    where: { name: value },
  });

  if (!state) {
    throw new Error(`State with name '${value}' does not exist.`);
  }

  return true;
};
