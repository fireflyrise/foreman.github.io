-- CreateTable: files/photos attached to an instruction.
CREATE TABLE "InstructionAttachment" (
    "id" TEXT NOT NULL,
    "instructionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstructionAttachment_instructionId_idx" ON "InstructionAttachment"("instructionId");

-- AddForeignKey
ALTER TABLE "InstructionAttachment"
    ADD CONSTRAINT "InstructionAttachment_instructionId_fkey"
    FOREIGN KEY ("instructionId") REFERENCES "Instruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
