import prisma from '../config/prisma';


export const logAction = async (
  userId: string | undefined, 
  action: string, 
  entity: string, 
  entityId?: string, 
  details?: string,
  ipAddress?: string
) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, details, ipAddress }
    });
  } catch (error) {
    console.error('Error saving audit log:', error);
  }
};