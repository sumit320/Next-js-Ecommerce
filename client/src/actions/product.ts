"use server";

type ValidationResult = 
  | { success: true }
  | { success: false; error: string };

export const protectProductFormAction = async (): Promise<ValidationResult> => {
  return {
    success: true,
  };
};
