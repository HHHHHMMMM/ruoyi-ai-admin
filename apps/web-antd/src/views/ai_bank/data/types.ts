/**
 * 图谱数据类型定义
 */

/**
 * 节点项接口
 */
export interface NodeItem {
  id: string;
  name: string;
  nodeType: string;
  properties?: Record<string, any>;
  style?: {
    fill: string;
    stroke: string;
  };
}

/**
 * 关系数据接口
 */
export interface RelationItem {
  id?: string;
  source: string;
  target: string;
  relationLabel: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

/**
 * 图谱数据结构
 */
export interface GraphData {
  nodes: NodeItem[];
  edges: RelationItem[];
}

/**
 * 图谱数据请求结果
 */
export interface GraphDataResult {
  code: number;
  data: GraphData;
  message: string;
}

/**
 * 路径分析参数
 */
export interface PathAnalysisParams {
  sourceId: string;
  targetId: string;
  maxDepth: number;
}

// 在types.ts中添加与后端匹配的数据类型
export interface Problem {
  problemId: string;
  problemType: string;
  description: string;
  isActive: boolean;
  // 其他属性...
}

export interface Step {
  problemId: string;
  stepId: number;
  operation: string;
  systemA?: string;
  tableName?: string;
  field?: string;
  conditionSql?: string;
  replyContent?: string;
  // 其他属性...
}

export interface StepRelation {
  problemId: string;
  fromStepId: number;
  toStepId: number;
  relationType: string;
  conditionExpression?: string;
  // 其他属性...
}

/**
 * 边项接口
 */
export interface EdgeItem {
  id: string;
  source: string;
  target: string;
  relationLabel: string;
  properties?: Record<string, any>;
}

/**
 * 边项接口
 */
export interface EdgeItem {
  id: string;
  source: string;
  target: string;
  relationLabel: string;
  properties?: Record<string, any>;
}

/**
 * 图谱数据结果接口
 */
export interface GraphDataResult {
  nodes: NodeItem[];
  edges: EdgeItem[];
  totalNodes?: number;
  totalEdges?: number;
}
