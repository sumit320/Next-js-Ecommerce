"use server";

type ValidationResult = 
  | { success: true }
  | { success: false; error: string };

export const protectSignUpAction = async (email: string): Promise<ValidationResult> => {
  return {
    success: true,
  };
};

export const protectSignInAction = async (email: string): Promise<ValidationResult> => {
  return {
    success: true,
  };
};
