import type { GraphData, NodeItem, RelationItem } from './types';

/**
 * 图谱工具类
 */
export class GraphUtils {
  /**
   * 合并图谱数据
   * @param original 原始数据
   * @param newData 新数据
   * @returns 合并后的数据
   */
  static mergeGraphData(original: GraphData, newData: GraphData): GraphData {
    // 创建节点ID集合，用于去重
    const nodeIds = new Set(original.nodes.map((node) => node.id));
    // 创建边ID集合，用于去重
    const edgeIds = new Set(
      original.edges.map(
        (edge) =>
          edge.id || `${edge.source}-${edge.target}-${edge.relationLabel}`,
      ),
    );

    // 合并节点
    const mergedNodes = [...original.nodes];
    newData.nodes.forEach((node) => {
      if (!nodeIds.has(node.id)) {
        mergedNodes.push(node);
        nodeIds.add(node.id);
      }
    });

    // 合并边
    const mergedEdges = [...original.edges];
    newData.edges.forEach((edge) => {
      const edgeId =
        edge.id || `${edge.source}-${edge.target}-${edge.relationLabel}`;
      if (!edgeIds.has(edgeId)) {
        mergedEdges.push(edge);
        edgeIds.add(edgeId);
      }
    });

    return {
      nodes: mergedNodes,
      edges: mergedEdges,
    };
  }

  /**
   * 获取所有节点类型
   * @param nodes 节点列表
   * @returns 节点类型列表
   */
  static getNodeTypes(nodes: NodeItem[]): string[] {
    const typeSet = new Set<string>();
    nodes.forEach((node) => {
      if (node.nodeType) {
        typeSet.add(node.nodeType);
      }
    });
    return Array.from(typeSet);
  }

  /**
   * 获取所有关系类型
   * @param edges 关系列表
   * @returns 关系类型列表
   */
  static getRelationTypes(edges: RelationItem[]): string[] {
    const typeSet = new Set<string>();
    edges.forEach((edge) => {
      if (edge.relationLabel) {
        typeSet.add(edge.relationLabel);
      }
    });
    return Array.from(typeSet);
  }

  /**
   * 根据ID获取节点
   * @param nodes 节点列表
   * @param id 节点ID
   * @returns 找到的节点或undefined
   */
  static getNodeById(nodes: NodeItem[], id: string): NodeItem | undefined {
    return nodes.find((node) => node.id === id);
  }

  /**
   * 过滤图谱数据
   * @param data 原始图谱数据
   * @param nodeTypes 要显示的节点类型
   * @param relationTypes 要显示的关系类型
   * @returns 过滤后的图谱数据
   */
  static filterGraphData(
    data: GraphData,
    nodeTypes: string[],
    relationTypes: string[],
  ): GraphData {
    // 如果没有提供筛选条件，返回原始数据
    if (nodeTypes.length === 0 && relationTypes.length === 0) {
      return data;
    }

    // 过滤节点
    const filteredNodes =
      nodeTypes.length === 0
        ? data.nodes
        : data.nodes.filter((node) => nodeTypes.includes(node.nodeType));

    // 获取所有保留节点的ID集合
    const nodeIds = new Set(filteredNodes.map((node) => node.id));

    // 过滤关系
    const filteredEdges = data.edges.filter((edge) => {
      const typeMatches =
        relationTypes.length === 0 ||
        relationTypes.includes(edge.relationLabel);
      const nodesIncluded =
        nodeIds.has(edge.source) && nodeIds.has(edge.target);
      return typeMatches && nodesIncluded;
    });

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }

  /**
   * 搜索节点
   * @param nodes 节点列表
   * @param keyword 关键词
   * @param searchType 搜索类型 (name|property|all)
   * @param propertyField 属性字段
   * @param searchMode 搜索模式 (fuzzy|exact)
   * @returns 匹配的节点列表
   */
  static searchNodes(
    nodes: NodeItem[],
    keyword: string,
    searchType: string = 'all',
    propertyField: string = 'all',
    searchMode: string = 'fuzzy',
  ): NodeItem[] {
    if (!keyword) return [];

    const normalizedKeyword = keyword.toLowerCase();
    const isExactMatch = searchMode === 'exact';

    return nodes.filter((node) => {
      // 搜索名称
      if (searchType === 'name' || searchType === 'all') {
        const nodeName = (node.name || node.label || '').toLowerCase();
        if (isExactMatch) {
          if (nodeName === normalizedKeyword) return true;
        } else {
          if (nodeName.includes(normalizedKeyword)) return true;
        }
      }

      // 搜索属性
      if (
        (searchType === 'property' || searchType === 'all') &&
        node.properties
      ) {
        if (propertyField === 'all') {
          // 搜索所有属性
          for (const key in node.properties) {
            const value = String(node.properties[key]).toLowerCase();
            if (isExactMatch) {
              if (value === normalizedKeyword) return true;
            } else {
              if (value.includes(normalizedKeyword)) return true;
            }
          }
        } else if (node.properties[propertyField]) {
          // 搜索特定属性
          const value = String(node.properties[propertyField]).toLowerCase();
          if (isExactMatch) {
            if (value === normalizedKeyword) return true;
          } else {
            if (value.includes(normalizedKeyword)) return true;
          }
        }
      }

      return false;
    });
  }
}
