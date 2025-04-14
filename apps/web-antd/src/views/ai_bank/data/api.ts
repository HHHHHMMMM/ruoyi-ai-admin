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
  createStepNode = '/knowledge/graph/stepNode',

  updateNode = '/knowledge/graph/node', // This is fine as the nodeId is appended in the function
  deleteNode = '/knowledge/graph/node',
  createRelation = '/knowledge/graph/relation',
  updateRelation = '/knowledge/graph/relation', // This is fine as relationId is appended in the function
  deleteRelation = '/knowledge/graph/relation',
  listProblemIds = '/knowledge/graph/problemIds',
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
export async function createNode(nodeData: any) {
  // 特殊处理问题节点
  if (nodeData.nodeType === 'Problem') {
    return createProblemNode(nodeData);
  }

  // 处理其他类型节点
  return requestClient.post(Api.createStepNode, nodeData);
}

// 专门处理问题节点的创建
export async function createProblemNode(nodeData: any) {
  // 构建问题数据结构
  const problemData = {
    problemType: nodeData.properties.problem_type,
    description: nodeData.properties.description,
    // 注意：不包含problemId，由后端生成
    // 其他自定义属性
    attributes: Object.entries(nodeData.properties)
      .filter(([key]) => !['problem_type', 'description'].includes(key))
      .reduce<Record<string, any>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {}),
  };

  // 调用专门的问题创建接口
  return requestClient.post(Api.createNode, problemData);
}

// 更新节点的API接口更新
export async function updateNode(nodeId: string, nodeData: any) {
  // 特殊处理问题节点
  if (nodeData.nodeType === 'Problem') {
    return updateProblemNode(nodeId, nodeData);
  }

  // 处理其他类型节点
  return requestClient.put(`${Api.updateNode}/${nodeId}`, nodeData);
}

// 专门处理问题节点的更新
export async function updateProblemNode(nodeId: string, nodeData: any) {
  // 构建问题数据结构
  const problemData = {
    problemId: nodeData.properties.problem_id, // 这里包含problemId，因为是更新操作
    problemType: nodeData.properties.problem_type,
    description: nodeData.properties.description,
    // 其他自定义属性
    attributes: Object.entries(nodeData.properties)
      .filter(
        ([key]) => !['problem_id', 'problem_type', 'description'].includes(key),
      )
      .reduce<Record<string, any>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {}),
  };

  // 调用专门的问题更新接口
  return requestClient.put(`${Api.updateNode}/${nodeId}`, problemData);
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

/**
 * 获取所有problem的problem_id
 * */
export async function listProblemIds() {
  try {
    const response = await requestClient.get(Api.listProblemIds);
    return {
      success: true,
      data: response?.rows || response || [],
      message: '获取问题列表成功',
    };
  } catch (error) {
    console.error('获取问题列表失败:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : '获取问题列表失败',
    };
  }
}

export async function createStepNode(stepData: any) {
  try {
    // 转换数据结构
    const step = {
      problemId: stepData.properties.problem_id,
      stepId: stepData.properties.step_id,
      operation: stepData.properties.operation,
      systemA: stepData.properties.system_a,
      tableName: stepData.properties.table_name,
      field: stepData.properties.field,
      conditionSql: stepData.properties.condition_sql,
      replyContent: stepData.properties.reply_content,
    };

    const response = await requestClient.post(Api.createStepNode, step);

    // 处理响应
    if (response === null) {
      return { success: true, message: 'step节点创建成功', data: null };
    }

    if (typeof response !== 'object' || !('code' in response)) {
      return { success: true, message: '操作完成', data: response };
    }

    return {
      success: response.code === 200,
      message:
        response.msg || (response.code === 200 ? '操作成功' : '操作失败'),
      data: response.data,
    };
  } catch (error) {
    console.error('创建Step节点失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
      data: null,
    };
  }
}

export async function getStepsByProblemId(problemId: string) {
  try {
    const response = await requestClient.get(`/knowledge/graph/${problemId}`);
    return {
      success: true,
      data: response?.rows || response || [],
      message: '获取步骤列表成功',
    };
  } catch (error) {
    console.error('获取步骤列表失败:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : '获取步骤列表失败',
    };
  }
}
