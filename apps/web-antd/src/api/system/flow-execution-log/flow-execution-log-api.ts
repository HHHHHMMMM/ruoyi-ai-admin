import type { FlowExecutionLog } from '#/api/system/flow-execution-log/flow-execution-log-modal.ts';

import type { ID, IDS, PageQuery, PageResult } from '#/api/common';

import { requestClient } from '#/api/request';

enum Api {
  flowLogList = '/knowledge-graph/flow-paths/list',
  flowLogCleanupExpired = '/knowledge-graph/flow-paths',
  root = '/knowledge-graph/flow-paths',
  getRoot = '/knowledge-graph/flow-paths/recent/problem/',
}

/**
 * 获取流程执行日志列表
 * @param params 请求参数
 * @returns list
 */
export function flowLogList(params?: PageQuery) {
  return requestClient.get<PageResult<FlowExecutionLog>>(Api.flowLogList, {
    params,
  });
}

/**
 * 获取流程执行日志详情
 * @param id 日志ID
 * @returns 日志详情
 */
export function flowLogInfo(id: ID) {
  return requestClient.get<FlowExecutionLog>(`${Api.getRoot}/${id}`);
}

/**
 * 更新流程执行日志
 * @param data 日志数据
 * @returns 更新结果
 */
export function flowLogUpdate(data: FlowExecutionLog) {
  return requestClient.put(Api.root, data);
}

/**
 * 删除流程执行日志
 * @param ids 日志ID数组
 * @returns 删除结果
 */
export function flowLogRemove(ids: IDS) {
  return requestClient.delete(`${Api.root}/${ids}`);
}

/**
 * 清理过期日志
 * @param days 保留天数
 * @returns 清理结果
 */
export function flowLogCleanupExpired(days: number) {
  return requestClient.post(Api.flowLogCleanupExpired, { days });
}
