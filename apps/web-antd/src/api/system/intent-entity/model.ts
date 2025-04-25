/**
 * Intent Entity Mapping entity
 */
export interface IntentEntityMapping {
  /** ID */
  id: number;
  /** Intent type */
  intentType: string;
  /** Entity name */
  entityName: string;
  /** Is required (1=Yes, 0=No) */
  isRequired: number;
  /** Priority */
  priority: number;
  /** Prompt template */
  promptTemplate?: string;
  /** Creation time */
  createdAt?: string;
  /** Update time */
  updatedAt?: string;
}
