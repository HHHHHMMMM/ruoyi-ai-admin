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
  deleteRelation as deleteRelationApi,
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
      // 使用示例数据
      graphData.value = getMockData();
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
      if (res.code === 200 && res.data) {
        // 合并新数据到现有图谱
        graphData.value = GraphUtils.mergeGraphData(graphData.value, res.data);
        return true;
      } else {
        throw new Error(res.msg || '获取节点关系失败');
      }
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
  const searchNodes = async (params: any) => {
    try {
      loading.value = true;

      // 如果只是关键词字符串，转为对象
      const searchParams =
        typeof params === 'string'
          ? { keyword: params, searchType: 'all', searchMode: 'fuzzy' }
          : params;

      const res = await searchNodesApi(searchParams);
      if (res.code === 200 && res.data) {
        // 合并新数据到现有图谱
        graphData.value = GraphUtils.mergeGraphData(graphData.value, res.data);

        // 如果返回的节点很少，可以提示用户
        if (res.data.nodes.length === 0) {
          message.warning('未找到匹配的节点');
        } else {
          message.success(`找到 ${res.data.nodes.length} 个匹配节点`);
        }

        return res.data.nodes;
      } else {
        throw new Error(res.msg || '搜索节点失败');
      }
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
      if (res.code === 200 && res.data) {
        // 合并新数据到现有图谱
        graphData.value = GraphUtils.mergeGraphData(graphData.value, res.data);

        if (res.data.edges.length === 0) {
          message.warning('未找到连接路径');
        } else {
          message.success(`找到 ${res.data.edges.length} 条连接路径`);
        }

        return res.data;
      } else {
        throw new Error(res.msg || '路径分析失败');
      }
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

  /**
   * 删除关系
   * @param relationId 关系ID
   */
  const deleteRelation = async (relationId: string) => {
    try {
      loading.value = true;
      const res = await deleteRelationApi(relationId);
      if (res.code === 200) {
        // 刷新图谱数据
        await fetchGraphData();
        message.success('关系删除成功');
        return true;
      } else {
        throw new Error(res.msg || '删除关系失败');
      }
    } catch (error) {
      console.error('删除关系异常:', error);
      message.error('删除关系失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取示例数据（当API调用失败时使用）
   */
  const getMockData = (): GraphData => {
    return {
      nodes: [
        {
          id: '1',
          name: '张三',
          nodeType: 'Person',
          properties: {
            age: 35,
            gender: '男',
            idNumber: '110101198505153578',
            phone: '13812345678',
          },
        },
        {
          id: '2',
          name: '李四',
          nodeType: 'Person',
          properties: {
            age: 42,
            gender: '男',
            idNumber: '110101197912253519',
            phone: '13987654321',
          },
        },
        {
          id: '3',
          name: '王五',
          nodeType: 'Person',
          properties: {
            age: 28,
            gender: '女',
            idNumber: '110101199301052389',
            phone: '13765432198',
          },
        },
        {
          id: '4',
          name: '中国银行北京分行',
          nodeType: 'Bank',
          properties: {
            location: '北京市西城区复兴门内大街1号',
            phone: '010-12345678',
            swiftCode: 'BKCHCNBJ',
          },
        },
        {
          id: '5',
          name: '6225880137691234',
          nodeType: 'Account',
          properties: {
            accountType: '储蓄卡',
            balance: 58906.25,
            openDate: '2018-03-15',
            status: '正常',
          },
        },
        {
          id: '6',
          name: '6225880198761234',
          nodeType: 'Account',
          properties: {
            accountType: '信用卡',
            balance: 12500.0,
            openDate: '2019-06-22',
            status: '正常',
            creditLimit: 50000.0,
          },
        },
        {
          id: '7',
          name: '转账交易20230518001',
          nodeType: 'Transaction',
          properties: {
            amount: 5000.0,
            currency: 'CNY',
            transactionTime: '2023-05-18 14:32:17',
            description: '购物消费',
          },
        },
        {
          id: '8',
          name: '招商银行北京分行',
          nodeType: 'Bank',
          properties: {
            location: '北京市朝阳区建国门外大街甲6号',
            phone: '010-87654321',
            swiftCode: 'CMBCCNBS',
          },
        },
        {
          id: '9',
          name: '阿里巴巴(北京)有限公司',
          nodeType: 'Company',
          properties: {
            industry: '电子商务',
            registrationNumber: '91110105MA007QEXXX',
            foundingDate: '2015-09-08',
            legalRepresentative: '马云',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: '1',
          target: '5',
          relationLabel: '拥有',
          properties: {
            since: '2018-03-15',
          },
        },
        {
          id: 'e2',
          source: '2',
          target: '6',
          relationLabel: '拥有',
          properties: {
            since: '2019-06-22',
          },
        },
        {
          id: 'e3',
          source: '5',
          target: '4',
          relationLabel: '属于',
          properties: {
            branchName: '北京分行',
          },
        },
        {
          id: 'e4',
          source: '6',
          target: '8',
          relationLabel: '属于',
          properties: {
            branchName: '北京分行',
          },
        },
        {
          id: 'e5',
          source: '5',
          target: '7',
          relationLabel: '发起',
          properties: {
            role: '付款方',
          },
        },
        {
          id: 'e6',
          source: '7',
          target: '6',
          relationLabel: '接收',
          properties: {
            role: '收款方',
          },
        },
        {
          id: 'e7',
          source: '1',
          target: '9',
          relationLabel: '就职于',
          properties: {
            position: '软件工程师',
            department: '技术部',
            since: '2020-01-15',
          },
        },
        {
          id: 'e8',
          source: '3',
          target: '9',
          relationLabel: '就职于',
          properties: {
            position: '市场经理',
            department: '市场部',
            since: '2019-04-10',
          },
        },
      ],
    };
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
    deleteRelation,
    getMockData,
  };
}
