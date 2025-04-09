// data/api.ts
import type { PageQuery } from '#/api/common';
import { requestClient } from '#/api/request';
import type { GraphDataResult } from './types';

enum Api {
  // 知识图谱基础操作
  createGraph = '/knowledge/graph/create',
  clearGraph = '/knowledge/graph/clear',
  verifyGraph = '/knowledge/graph/verify',

  // 图谱数据操作
  graphData = '/knowledge/graph/data',
  nodeRelations = '/knowledge/graph/node/relations',
  searchNodes = '/knowledge/graph/search',
  findPath = '/knowledge/graph/path',

  // 直接操作Neo4j节点和关系
  createNode = '/knowledge/graph/node',
  updateNode = '/knowledge/graph/node',
  deleteNode = '/knowledge/graph/node',
  createRelation = '/knowledge/graph/relation',
  updateRelation = '/knowledge/graph/relation',
  deleteRelation = '/knowledge/graph/relation',
}

/**
 * 创建/重建知识图谱
 */
export function createKnowledgeGraph() {
  return requestClient.post(Api.createGraph, null, {
    successMessageMode: 'message',
  });
}

/**
 * 清空知识图谱
 */
export function clearKnowledgeGraph() {
  return requestClient.delete(Api.clearGraph, {
    successMessageMode: 'message',
  });
}

/**
 * 验证知识图谱结构
 */
export function verifyKnowledgeGraph() {
  return requestClient.get(Api.verifyGraph, {
    successMessageMode: 'message',
  });
}

/**
 * 获取图谱数据
 * @param params 分页查询参数（可选）
 */
export function getGraphData(params?: PageQuery) {
  return requestClient.get<GraphDataResult>(Api.graphData, { params });
}

/**
 * 获取节点关系
 * @param nodeId 节点ID
 */
export function getNodeRelations(nodeId: string) {
  return requestClient.get<GraphDataResult>(`${Api.nodeRelations}/${nodeId}`);
}

/**
 * 搜索节点
 * @param params 搜索参数
 */
export function searchNodes(params: {
  keyword: string;
  searchType?: string;
  propertyField?: string;
  searchMode?: string;
}) {
  return requestClient.get<GraphDataResult>(Api.searchNodes, { params });
}

/**
 * 查找路径
 * @param params 路径查询参数
 */
export function findPath(params: {
  sourceId: string;
  targetId: string;
  maxDepth: number;
}) {
  return requestClient.get<GraphDataResult>(Api.findPath, { params });
}

/**
 * 创建节点
 * @param nodeData 节点数据
 */
export function createNode(nodeData: any) {
  return requestClient.post(Api.createNode, nodeData, {
    successMessageMode: 'message',
  });
}

/**
 * 更新节点
 * @param nodeId 节点ID
 * @param nodeData 节点数据
 */
export function updateNode(nodeId: string, nodeData: any) {
  return requestClient.put(`${Api.updateNode}/${nodeId}`, nodeData, {
    successMessageMode: 'message',
  });
}

/**
 * 删除节点
 * @param nodeId 节点ID
 */
export function deleteNode(nodeId: string) {
  return requestClient.delete(`${Api.deleteNode}/${nodeId}`, {
    successMessageMode: 'message',
  });
}

/**
 * 创建关系
 * @param relationData 关系数据
 */
export function createRelation(relationData: any) {
  return requestClient.post(Api.createRelation, relationData, {
    successMessageMode: 'message',
  });
}

/**
 * 更新关系
 * @param relationId 关系ID
 * @param relationData 关系数据
 */
export function updateRelation(relationId: string, relationData: any) {
  return requestClient.put(
    `${Api.updateRelation}/${relationId}`,
    relationData,
    {
      successMessageMode: 'message',
    },
  );
}

/**
 * 删除关系
 * @param relationId 关系ID
 */
export function deleteRelation(relationId: string) {
  return requestClient.delete(`${Api.deleteRelation}/${relationId}`, {
    successMessageMode: 'message',
  });
}

// 用于hooks/useGraphData.js中使用的别名
export const fetchNodeRelationsApi = getNodeRelations;
export const searchNodesApi = (keyword: string) => {
  return searchNodes({ keyword });
};
