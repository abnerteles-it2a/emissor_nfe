export type Role = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'OPERATOR' | 'VIEWER';

export type Action =
  | 'DOCUMENT_EMIT'
  | 'DOCUMENT_CANCEL'
  | 'DOCUMENT_VIEW'
  | 'DOCUMENT_CCE'
  | 'CERTIFICATE_MANAGE'
  | 'MEMBERS_MANAGE'
  | 'SUBSCRIPTION_MANAGE'
  | 'BATCH_EXPORT_XML';

const ROLE_PERMISSIONS: Record<Role, readonly Action[]> = {
  OWNER: [
    'DOCUMENT_EMIT',
    'DOCUMENT_CANCEL',
    'DOCUMENT_VIEW',
    'DOCUMENT_CCE',
    'CERTIFICATE_MANAGE',
    'MEMBERS_MANAGE',
    'SUBSCRIPTION_MANAGE',
    'BATCH_EXPORT_XML',
  ],
  ADMIN: [
    'DOCUMENT_EMIT',
    'DOCUMENT_CANCEL',
    'DOCUMENT_VIEW',
    'DOCUMENT_CCE',
    'CERTIFICATE_MANAGE',
    'MEMBERS_MANAGE',
    'SUBSCRIPTION_MANAGE',
    'BATCH_EXPORT_XML',
  ],
  ACCOUNTANT: [
    'DOCUMENT_EMIT',
    'DOCUMENT_CANCEL',
    'DOCUMENT_VIEW',
    'DOCUMENT_CCE',
    'CERTIFICATE_MANAGE',
    'BATCH_EXPORT_XML',
  ],
  OPERATOR: [
    'DOCUMENT_EMIT',
    'DOCUMENT_VIEW',
  ],
  VIEWER: [
    'DOCUMENT_VIEW',
  ],
};

export function canPerform(role: string, action: Action): boolean {
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;
  return permissions.includes(action);
}
