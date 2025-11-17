"use server";

type ValidationResult = 
  | { success: true }
  | { success: false; error: string };

export const protectCouponFormAction = async (): Promise<ValidationResult> => {
  return {
    success: true,
  };
};
