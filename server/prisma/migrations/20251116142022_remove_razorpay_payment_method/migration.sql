-- Update any existing orders with RAZORPAY payment method to CREDIT_CARD
UPDATE "Order" SET "paymentMethod" = 'CREDIT_CARD' WHERE "paymentMethod" = 'RAZORPAY';

-- Create a new enum type without RAZORPAY
CREATE TYPE "PaymentMethod_new" AS ENUM ('CREDIT_CARD');

-- Alter the column to use the new enum
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");

-- Drop the old enum
DROP TYPE "PaymentMethod";

-- Rename the new enum to the original name
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";

