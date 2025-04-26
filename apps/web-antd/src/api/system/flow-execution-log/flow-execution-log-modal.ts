/**
 * 流程执行日志模型
 */
export interface FlowExecutionLog {
  /**
   * 主键ID
   */
  id: number;

  /**
   * 流程ID
   */
  flowId: string;

  /**
   * 用户ID
   */
  userId: string;

  /**
   * 问题ID
   */
  problemId: string;

  /**
   * 执行时间
   */
  executedAt: string | Date;

  /**
   * 上下文数据 (JSON)
   */
  context: string | any;

  /**
   * 路径数据 (JSON)
   */
  pathData: string | any;

  /**
   * 执行详情数据 (JSON)
   */
  executionDetails: string | any;

  /**
   * 状态 (STARTED, COMPLETED, FAILED)
   */
  status: string;
}

/**
 * 执行步骤详情
 */
export interface ExecutionStepDetail {
  /**
   * 步骤ID
   */
  stepId: string;

  /**
   * 操作类型
   * - query: 数据查询
   * - condition: 条件判断
   * - reply: 回复生成
   * - transition: 路径转移
   * - query_error: 查询错误
   * - reply_error: 回复错误
   * - transition_error: 转移错误
   * - execution_error: 执行错误
   */
  operation: string;

  /**
   * 执行时间
   */
  executionTime?: string;

  /**
   * SQL语句
   */
  sqlStatement?: string;

  /**
   * SQL执行结果
   */
  sqlResult?: any;

  /**
   * 条件表达式
   */
  condition?: string;

  /**
   * 条件评估结果
   */
  conditionResult?: boolean;

  /**
   * 下一步ID
   */
  nextStepId?: string;

  /**
   * 错误信息
   */
  errorMessage?: string;
}

/**
 * 路径节点
 */
export interface PathNode {
  /**
   * 节点ID
   */
  id: string;

  /**
   * 节点名称
   */
  name: string;

  /**
   * 节点类型 (Problem, Step)
   */
  nodeType: string;

  /**
   * 节点属性
   */
  properties: Record<string, any>;
}

/**
 * 路径边
 */
export interface PathEdge {
  /**
   * 边ID
   */
  id: string;

  /**
   * 源节点ID
   */
  source: string;

  /**
   * 目标节点ID
   */
  target: string;

  /**
   * 关系标签 (FIRST_STEP, NEXT_DEFAULT, NEXT_IF)
   */
  relationLabel: string;

  /**
   * 边属性
   */
  properties?: Record<string, any>;

  /**
   * 是否实际走过
   */
  taken: boolean;
}

/**
 * 路径数据
 */
export interface PathData {
  /**
   * 节点列表
   */
  nodes: PathNode[];

  /**
   * 边列表
   */
  edges: PathEdge[];
}

/**
 * 清理过期日志参数
 */
export interface CleanupExpiredParams {
  /**
   * 保留天数
   */
  days: number;
}
