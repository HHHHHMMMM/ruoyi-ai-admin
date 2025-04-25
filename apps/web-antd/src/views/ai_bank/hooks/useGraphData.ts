import { ref, computed } from 'vue';
import {
  getGraphData,
  getNodeRelations,
  searchNodes as searchNodesApi,
  findPath as findPathApi,
  createNode as createNodeApi,
  updateNode as updateNodeApi,
  deleteNode as deleteNodeApi,
  createRelation as createRelationApi,
  updateRelation as updateRelationApi,
  searchProblemGraph,
} from '../data/api';
import type { GraphData, PathAnalysisParams } from '../data/types';
import { GraphUtils } from '../data/graphUtils';
import { message } from 'ant-design-vue';

export function useGraphData() {
  // 图谱数据
  const graphData = ref<GraphData>({
    nodes: [],
    edges: [],
  });

  // 加载状态
  const loading = ref<boolean>(false);

  // 节点类型列表
  const nodeTypes = computed(() => {
    return GraphUtils.getNodeTypes(graphData.value.nodes);
  });

  // 关系类型列表
  const relationTypes = computed(() => {
    return GraphUtils.getRelationTypes(graphData.value.edges);
  });

  /**
   * 加载图谱数据
   */
  const fetchGraphData = async () => {
    try {
      loading.value = true;
      const res = await getGraphData();
      console.log(res);
      graphData.value = res;
    } catch (error) {
      console.error('获取图谱数据异常:', error);
      message.error('获取图谱数据失败');
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取节点关系
   * @param nodeId 节点ID
   */
  const fetchNodeRelations = async (nodeId: string) => {
    try {
      loading.value = true;
      const res = await getNodeRelations(nodeId);
      // 合并新数据到现有图谱
      graphData.value = GraphUtils.mergeGraphData(graphData.value, res.data);
      return true;
    } catch (error) {
      console.error('获取节点关系异常:', error);
      message.error('获取节点关系失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 搜索节点
   * @param params 搜索参数
   */
  // 在包含 searchNodes 方法的文件中修改
  const searchNodes = async (params: any) => {
    try {
      loading.value = true;

      // 如果只是关键词字符串，转为对象
      const searchParams =
        typeof params === 'string'
          ? { keyword: params, searchMode: 'fuzzy' }
          : params;

      // 如果是问题搜索，调用专门的API
      if (searchParams.searchType === 'problem') {
        const res = await searchProblemGraph({
          keyword: searchParams.keyword,
          searchMode: searchParams.searchMode,
        });

        // 修正：应该将整个 res 赋值给 graphData，而不是 res.nodes
        graphData.value = res; // 这里包含了 nodes 和 edges

        if (res?.nodes?.length === 0) {
          message.warning('未找到匹配的问题');
        } else if (res?.nodes) {
          const problemCount = res.nodes.filter(
            (n) => n.nodeType === 'Problem',
          ).length;
          message.success(`找到 ${problemCount} 个匹配问题`);
        }
        return res.nodes || [];
      } else {
        // 原有的通用搜索逻辑
        const res = await searchNodesApi(searchParams);
        if (res.code === 200 && res.data) {
          graphData.value = GraphUtils.mergeGraphData(
            graphData.value,
            res.data,
          );

          if (res.data.nodes.length === 0) {
            message.warning('未找到匹配的节点');
          } else {
            message.success(`找到 ${res.data.nodes.length} 个匹配节点`);
          }

          return res.data.nodes;
        }
      }

      throw new Error('搜索失败');
    } catch (error) {
      console.error('搜索节点异常:', error);
      message.error('搜索节点失败');
      return [];
    } finally {
      loading.value = false;
    }
  };
  /**
   * 路径分析
   * @param params 路径分析参数
   */
  const findPath = async (params: PathAnalysisParams) => {
    try {
      loading.value = true;
      const res = await findPathApi(params);
      // 合并新数据到现有图谱
      graphData.value = GraphUtils.mergeGraphData(graphData.value, res.data);
      if (res.data.edges.length === 0) {
        message.warning('未找到连接路径');
      } else {
        message.success(`找到 ${res.data.edges.length} 条连接路径`);
      }
      return res.data;
    } catch (error) {
      console.error('路径分析异常:', error);
      message.error('路径分析失败');
      return { nodes: [], edges: [] };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建节点
   * @param nodeData 节点数据
   */
  const createNode = async (nodeData: any) => {
    try {
      loading.value = true;
      const res = await createNodeApi(nodeData);
      if (res.code === 200) {
        // 刷新图谱数据
        await fetchGraphData();
        message.success('节点创建成功');
        return true;
      } else {
        throw new Error(res.msg || '创建节点失败');
      }
    } catch (error) {
      console.error('创建节点异常:', error);
      message.error('创建节点失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新节点
   * @param nodeId 节点ID
   * @param nodeData 节点数据
   */
  const updateNode = async (nodeId: string, nodeData: any) => {
    try {
      loading.value = true;
      const res = await updateNodeApi(nodeId, nodeData);
      if (res.code === 200) {
        // 刷新图谱数据
        await fetchGraphData();
        message.success('节点更新成功');
        return true;
      } else {
        throw new Error(res.msg || '更新节点失败');
      }
    } catch (error) {
      console.error('更新节点异常:', error);
      message.error('更新节点失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除节点
   * @param nodeId 节点ID
   */
  const deleteNode = async (nodeId: string) => {
    try {
      loading.value = true;
      const res = await deleteNodeApi(nodeId);
      if (res.code === 200) {
        // 刷新图谱数据
        await fetchGraphData();
        message.success('节点删除成功');
        return true;
      } else {
        throw new Error(res.msg || '删除节点失败');
      }
    } catch (error) {
      console.error('删除节点异常:', error);
      message.error('删除节点失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建关系
   * @param relationData 关系数据
   */
  const createRelation = async (relationData: any) => {
    try {
      loading.value = true;
      const res = await createRelationApi(relationData);
      if (res.code === 200) {
        // 刷新图谱数据
        await fetchGraphData();
        message.success('关系创建成功');
        return true;
      } else {
        throw new Error(res.msg || '创建关系失败');
      }
    } catch (error) {
      console.error('创建关系异常:', error);
      message.error('创建关系失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新关系
   * @param relationId 关系ID
   * @param relationData 关系数据
   */
  const updateRelation = async (relationId: string, relationData: any) => {
    try {
      loading.value = true;
      const res = await updateRelationApi(relationId, relationData);
      if (res.code === 200) {
        // 刷新图谱数据
        await fetchGraphData();
        message.success('关系更新成功');
        return true;
      } else {
        throw new Error(res.msg || '更新关系失败');
      }
    } catch (error) {
      console.error('更新关系异常:', error);
      message.error('更新关系失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    graphData,
    loading,
    nodeTypes,
    relationTypes,
    fetchGraphData,
    fetchNodeRelations,
    searchNodes,
    findPath,
    createNode,
    updateNode,
    deleteNode,
    createRelation,
    updateRelation,
  };
}
