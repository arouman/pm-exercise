-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "rentalStart" DATETIME;

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ownership" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dailyRate" REAL NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "vendorId" TEXT,
    "purchaseOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Equipment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Equipment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL,
    "expectedEndDate" DATETIME NOT NULL,
    "actualEndDate" DATETIME,
    "status" TEXT NOT NULL,
    "dailyRate" REAL NOT NULL,
    "notes" TEXT,
    "equipmentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentAssignment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipmentAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "condition" TEXT,
    "photoUrl" TEXT,
    "notes" TEXT,
    "equipmentId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "syncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentEvent_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "EquipmentAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipmentEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipmentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_assetTag_key" ON "Equipment"("assetTag");

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- CreateIndex
CREATE INDEX "Equipment_ownership_idx" ON "Equipment"("ownership");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_equipmentId_idx" ON "EquipmentAssignment"("equipmentId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_projectId_idx" ON "EquipmentAssignment"("projectId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_status_idx" ON "EquipmentAssignment"("status");

-- CreateIndex
CREATE INDEX "EquipmentEvent_equipmentId_idx" ON "EquipmentEvent"("equipmentId");

-- CreateIndex
CREATE INDEX "EquipmentEvent_type_idx" ON "EquipmentEvent"("type");

-- CreateIndex
CREATE INDEX "EquipmentEvent_occurredAt_idx" ON "EquipmentEvent"("occurredAt");
