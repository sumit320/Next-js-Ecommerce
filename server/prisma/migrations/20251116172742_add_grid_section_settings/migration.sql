-- CreateTable
CREATE TABLE "GridSectionSettings" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GridSectionSettings_pkey" PRIMARY KEY ("id")
);
