import type { SystemDataSourceConfig } from './model';

import { requestClient } from '#/api/request';
import type { PageQuery } from '#/api/common';

enum Api {
  root = '/knowledge-graph/datasource',
}

/**
 * 获取数据源列表（分页）
 */

export function dataSourceList(params?: PageQuery) {
  return requestClient.get<SystemDataSourceConfig[]>(`${Api.root}/list`, {
    params,
  });
}

/**
 * 获取数据源详情
 */
export function dataSourceInfo(id: string | number) {
  return requestClient.get<SystemDataSourceConfig>(`${Api.root}/${id}`);
}

/**
 * 添加数据源
 */
export function dataSourceAdd(data: SystemDataSourceConfig) {
  return requestClient.postWithMsg<SystemDataSourceConfig>(Api.root, data);
}

/**
 * 更新数据源
 */
export function dataSourceUpdate(data: SystemDataSourceConfig) {
  return requestClient.putWithMsg<SystemDataSourceConfig>(Api.root, data);
}
/**
 * 删除数据源
 */
export function dataSourceRemove(id: string | number) {
  return requestClient.deleteWithMsg<void>(`${Api.root}/${id}`);
}

/**
 * 测试数据源连接
 */
export function dataSourceTestConnection(data: SystemDataSourceConfig) {
  return requestClient.post<boolean>(`${Api.root}/test-connection`, data);
}
