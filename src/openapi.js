import swaggerJsdoc from 'swagger-jsdoc';

export const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SubBase Take-Home API',
      version: '1.0.0',
      description:
        'REST API for the SubBase take-home starter environment. Provides read/write access to the existing SubBase domain: vendors, materials, projects, users, purchase orders, deliveries, and inventory. The rental-equipment domain is intentionally not modelled — that is the candidate\'s deliverable.',
    },
    servers: [{ url: '/', description: 'Same origin' }],
    tags: [
      { name: 'Health' },
      { name: 'Users' },
      { name: 'Vendors' },
      { name: 'Materials' },
      { name: 'Projects' },
      { name: 'Purchase Orders' },
      { name: 'Deliveries' },
      { name: 'Inventory' },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object', nullable: true },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: {
              type: 'string',
              enum: ['PROCUREMENT', 'SUPERINTENDENT', 'FLEET_MANAGER'],
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Vendor: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            category: {
              type: 'string',
              enum: [
                'CONCRETE',
                'REBAR',
                'FASTENERS',
                'LUMBER',
                'ELECTRICAL',
                'TOOLS_RENTAL_EXTERNAL',
              ],
            },
            contactEmail: { type: 'string' },
            contactPhone: { type: 'string' },
            paymentTerms: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Material: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sku: { type: 'string' },
            name: { type: 'string' },
            category: { type: 'string' },
            unit: {
              type: 'string',
              enum: ['EA', 'LF', 'CY', 'LB', 'BAG'],
            },
            unitPrice: { type: 'number' },
            vendorId: { type: 'string' },
            vendor: { $ref: '#/components/schemas/Vendor' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            customer: { type: 'string' },
            address: { type: 'string' },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD'],
            },
            startDate: { type: 'string', format: 'date-time' },
            projectedEndDate: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PurchaseOrderLine: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            purchaseOrderId: { type: 'string' },
            materialId: { type: 'string' },
            quantity: { type: 'number' },
            unitPrice: { type: 'number' },
            lineTotal: { type: 'number' },
            material: { $ref: '#/components/schemas/Material' },
          },
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            poNumber: { type: 'string' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'],
            },
            total: { type: 'number' },
            expectedDelivery: { type: 'string', format: 'date-time', nullable: true },
            vendorId: { type: 'string' },
            projectId: { type: 'string' },
            createdById: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            vendor: { $ref: '#/components/schemas/Vendor' },
            project: { $ref: '#/components/schemas/Project' },
            createdBy: { $ref: '#/components/schemas/User' },
            lines: {
              type: 'array',
              items: { $ref: '#/components/schemas/PurchaseOrderLine' },
            },
          },
        },
        DeliveryLine: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            deliveryId: { type: 'string' },
            purchaseOrderLineId: { type: 'string' },
            quantityReceived: { type: 'number' },
          },
        },
        Delivery: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            deliveredAt: { type: 'string', format: 'date-time' },
            status: {
              type: 'string',
              enum: ['PENDING', 'PARTIAL', 'COMPLETE'],
            },
            notes: { type: 'string', nullable: true },
            purchaseOrderId: { type: 'string' },
            receivedById: { type: 'string' },
            purchaseOrder: { $ref: '#/components/schemas/PurchaseOrder' },
            receivedBy: { $ref: '#/components/schemas/User' },
            lines: {
              type: 'array',
              items: { $ref: '#/components/schemas/DeliveryLine' },
            },
          },
        },
        InventoryItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            materialId: { type: 'string' },
            projectId: { type: 'string' },
            quantityOnHand: { type: 'number' },
            lastUpdatedAt: { type: 'string', format: 'date-time' },
            material: { $ref: '#/components/schemas/Material' },
            project: { $ref: '#/components/schemas/Project' },
          },
        },
        InventoryTransaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['IN', 'OUT', 'TRANSFER'] },
            quantity: { type: 'number' },
            reference: { type: 'string', nullable: true },
            materialId: { type: 'string' },
            projectId: { type: 'string' },
            fromProjectId: { type: 'string', nullable: true },
            userId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            material: { $ref: '#/components/schemas/Material' },
            project: { $ref: '#/components/schemas/Project' },
            fromProject: { $ref: '#/components/schemas/Project' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});
