import type { IntentEntityMapping } from './model';

import type { PageQuery, PageResult } from '#/api/common';

import { requestClient } from '#/api/request';
// Define API endpoints
const Api = {
  root: '/intent',
  list: '/intent/list',
};

/**
 * Get intent entity mapping list with pagination
 * @param mapping
 * @param pageQuery
 */
export function intentEntityList(
  mapping?: IntentEntityMapping,
  pageQuery?: PageQuery,
) {
  return requestClient.get<PageResult<IntentEntityMapping>>(Api.list, {
    params: {
      ...mapping, // 这将包含intent_type
      ...pageQuery, // 这将包含pageNum和pageSize
    },
  });
}

/**
 * Get intent entity mapping detail by ID
 * @param id Mapping ID
 */
export function intentEntityInfo(id: string | number) {
  return requestClient.get<IntentEntityMapping>(`${Api.root}/${id}`);
}

/**
 * Add new intent entity mapping
 * @param data Mapping data
 */
export function intentEntityAdd(data: Partial<IntentEntityMapping>) {
  return requestClient.postWithMsg<void>(Api.root, data);
}

/**
 * Update intent entity mapping
 * @param data Mapping data
 */
export function intentEntityUpdate(data: Partial<IntentEntityMapping>) {
  return requestClient.putWithMsg<void>(Api.root, data);
}

/**
 * Remove intent entity mapping(s)
 * @param ids Mapping IDs to remove
 */
export function intentEntityRemove(id: string | number) {
  return requestClient.deleteWithMsg<void>(`${Api.root}/${id}`);
}
