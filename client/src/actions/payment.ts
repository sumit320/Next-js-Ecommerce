"use server";

export const paymentAction = async (email: string): Promise<{ success: true } | { success: false; error: string }> => {
  if (!email || email.trim() === "") {
    return {
      success: false,
      error: "Email is required",
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Please enter a valid email address",
    };
  }

  return {
    success: true,
  };
};
