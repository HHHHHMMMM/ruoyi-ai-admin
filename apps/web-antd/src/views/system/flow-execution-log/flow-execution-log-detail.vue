<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { flowLogInfo } from '#/api/system/flow-execution-log/flow-execution-log-api';

import { jsonViewerSchema } from './flow-execution-log-data';

// 执行步骤详情
const executionDetails = ref([]);
const pathData = ref({ nodes: [], edges: [] });

const [BasicForm, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 120,
  },
  schema: jsonViewerSchema(),
  showDefaultActions: false,
});

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: true,
  title: '流程执行日志详情',
  width: '80%',
  modalProps: {
    footer: null,
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);
    const { id } = modalApi.getData() as { id?: number | string };
    if (id) {
      const record = await flowLogInfo(id);

      // 解析JSON字段
      try {
        if (record.context) {
          record.context = JSON.parse(record.context);
        }
        if (record.pathData) {
          record.pathData = JSON.parse(record.pathData);
          pathData.value = record.pathData;
        }
        if (record.executionDetails) {
          record.executionDetails = JSON.parse(record.executionDetails);
          executionDetails.value = record.executionDetails;
        }
      } catch (error) {
        console.error('解析JSON字段失败', error);
      }

      await formApi.setValues(record);
    }
    modalApi.modalLoading(false);
  },
});

// 切换标签页
const activeKey = ref('1');
</script>

<template>
  <BasicModal>
    <!--    <a-tabs v-model:activeKey="activeKey">-->
    <!--      <a-tab-pane key="1" tab="执行详情">-->
    <!--        <BasicForm />-->
    <!--      </a-tab-pane>-->
    <!--      <a-tab-pane key="2" tab="路径可视化">-->
    <!--        <div class="p-4">-->
    <!--          <div class="text-lg font-bold mb-4">执行路径图</div>-->
    <!--          <div class="border rounded p-4 bg-gray-50 min-h-80">-->
    <!--            &lt;!&ndash; 这里可以使用图形库如G6或mxGraph来可视化路径 &ndash;&gt;-->
    <!--            <div v-if="pathData.nodes.length === 0" class="text-center text-gray-500 py-8">-->
    <!--              暂无路径数据-->
    <!--            </div>-->
    <!--            <div v-else>-->
    <!--              &lt;!&ndash; 简单表格展示节点和边 &ndash;&gt;-->
    <!--              <div class="mb-4">-->
    <!--                <div class="text-md font-medium mb-2">节点列表</div>-->
    <!--                <a-table-->
    <!--                  :dataSource="pathData.nodes"-->
    <!--                  :columns="[-->
    <!--                    { title: 'ID', dataIndex: 'id', key: 'id' },-->
    <!--                    { title: '名称', dataIndex: 'name', key: 'name' },-->
    <!--                    { title: '类型', dataIndex: 'nodeType', key: 'nodeType' },-->
    <!--                  ]"-->
    <!--                  size="small"-->
    <!--                  :pagination="false"-->
    <!--                />-->
    <!--              </div>-->
    <!--              <div>-->
    <!--                <div class="text-md font-medium mb-2">边列表</div>-->
    <!--                <a-table-->
    <!--                  :dataSource="pathData.edges"-->
    <!--                  :columns="[-->
    <!--                    { title: '源节点', dataIndex: 'source', key: 'source' },-->
    <!--                    { title: '目标节点', dataIndex: 'target', key: 'target' },-->
    <!--                    { title: '关系', dataIndex: 'relationLabel', key: 'relationLabel' }-->
    <!--                ]"-->
    <!--                size="small"-->
    <!--                :pagination="false"-->
    <!--                />-->
    <!--              </div>-->
    <!--            </div>-->
    <!--          </div>-->
    <!--        </div>-->
    <!--      </a-tab-pane>-->
    <!--&lt;!&ndash;      <a-tab-pane key="3" tab="执行步骤">&ndash;&gt;-->
    <!--&lt;!&ndash;        <div class="p-4">&ndash;&gt;-->
    <!--&lt;!&ndash;          <div class="text-lg font-bold mb-4">执行步骤详情</div>&ndash;&gt;-->
    <!--&lt;!&ndash;          <div v-if="executionDetails.length === 0" class="text-center text-gray-500 py-8">&ndash;&gt;-->
    <!--&lt;!&ndash;            暂无执行详情数据&ndash;&gt;-->
    <!--&lt;!&ndash;          </div>&ndash;&gt;-->
    <!--&lt;!&ndash;          <a-timeline v-else>&ndash;&gt;-->
    <!--&lt;!&ndash;            <a-timeline-item&ndash;&gt;-->
    <!--&lt;!&ndash;              v-for="(detail, index) in executionDetails"&ndash;&gt;-->
    <!--&lt;!&ndash;              :key="index"&ndash;&gt;-->
    <!--&lt;!&ndash;              :color="detail.errorMessage ? 'red' : detail.operation === 'query' ? 'blue' :&ndash;&gt;-->
    <!--&lt;!&ndash;                     detail.operation === 'condition' ? (detail.conditionResult ? 'green' : 'orange') : 'gray'"&ndash;&gt;-->
    <!--&lt;!&ndash;            >&ndash;&gt;-->
    <!--&lt;!&ndash;              <template #dot v-if="detail.operation === 'query'">&ndash;&gt;-->
    <!--&lt;!&ndash;                <database-outlined />&ndash;&gt;-->
    <!--&lt;!&ndash;              </template>&ndash;&gt;-->
    <!--&lt;!&ndash;              <template #dot v-else-if="detail.operation === 'condition'">&ndash;&gt;-->
    <!--&lt;!&ndash;                <branches-outlined />&ndash;&gt;-->
    <!--&lt;!&ndash;              </template>&ndash;&gt;-->
    <!--&lt;!&ndash;              <template #dot v-else-if="detail.operation === 'reply'">&ndash;&gt;-->
    <!--&lt;!&ndash;                <message-outlined />&ndash;&gt;-->
    <!--&lt;!&ndash;              </template>&ndash;&gt;-->

    <!--&lt;!&ndash;              <div class="font-medium">&ndash;&gt;-->
    <!--&lt;!&ndash;                步骤 {{ detail.stepId }} - {{&ndash;&gt;-->
    <!--&lt;!&ndash;                  detail.operation === 'query' ? '数据查询' :&ndash;&gt;-->
    <!--&lt;!&ndash;                    detail.operation === 'condition' ? '条件判断' :&ndash;&gt;-->
    <!--&lt;!&ndash;                      detail.operation === 'reply' ? '生成回复' :&ndash;&gt;-->
    <!--&lt;!&ndash;                        detail.operation === 'transition' ? '路径转移' :&ndash;&gt;-->
    <!--&lt;!&ndash;                          detail.operation&ndash;&gt;-->
    <!--&lt;!&ndash;                }}&ndash;&gt;-->
    <!--&lt;!&ndash;                <a-tag v-if="detail.executionTime" color="blue">{{ detail.executionTime }}</a-tag>&ndash;&gt;-->
    <!--&lt;!&ndash;              </div>&ndash;&gt;-->

    <!--&lt;!&ndash;              <div v-if="detail.sqlStatement" class="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">&ndash;&gt;-->
    <!--&lt;!&ndash;                <div class="font-medium mb-1">SQL语句:</div>&ndash;&gt;-->
    <!--&lt;!&ndash;                <pre>{{ detail.sqlStatement }}</pre>&ndash;&gt;-->

    <!--&lt;!&ndash;                <div v-if="detail.sqlResult" class="mt-2">&ndash;&gt;-->
    <!--&lt;!&ndash;                  <div class="font-medium mb-1">查询结果:</div>&ndash;&gt;-->
    <!--&lt;!&ndash;                  <pre>{{ JSON.stringify(detail.sqlResult, null, 2) }}</pre>&ndash;&gt;-->
    <!--&lt;!&ndash;                </div>&ndash;&gt;-->
    <!--&lt;!&ndash;              </div>&ndash;&gt;-->

    <!--&lt;!&ndash;              <div v-if="detail.condition" class="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">&ndash;&gt;-->
    <!--&lt;!&ndash;                <div class="font-medium mb-1">条件表达式:</div>&ndash;&gt;-->
    <!--&lt;!&ndash;                <pre>{{ detail.condition }}</pre>&ndash;&gt;-->

    <!--&lt;!&ndash;                <div v-if="detail.conditionResult !== undefined" class="mt-1">&ndash;&gt;-->
    <!--&lt;!&ndash;                  <div class="font-medium">评估结果:</div>&ndash;&gt;-->
    <!--&lt;!&ndash;                  <a-tag :color="detail.conditionResult ? 'success' : 'error'">&ndash;&gt;-->
    <!--&lt;!&ndash;                    {{ detail.conditionResult ? '满足' : '不满足' }}&ndash;&gt;-->
    <!--&lt;!&ndash;                  </a-tag>&ndash;&gt;-->
    <!--&lt;!&ndash;                </div>&ndash;&gt;-->

    <!--&lt;!&ndash;                <div v-if="detail.nextStepId" class="mt-1">&ndash;&gt;-->
    <!--&lt;!&ndash;                  <div class="font-medium">下一步:</div>&ndash;&gt;-->
    <!--&lt;!&ndash;                  <a-tag color="blue">步骤 {{ detail.nextStepId }}</a-tag>&ndash;&gt;-->
    <!--&lt;!&ndash;                </div>&ndash;&gt;-->
    <!--&lt;!&ndash;              </div>&ndash;&gt;-->

    <!--&lt;!&ndash;              <div v-if="detail.errorMessage" class="mt-2 bg-red-50 p-2 rounded text-xs text-red-500">&ndash;&gt;-->
    <!--&lt;!&ndash;                <div class="font-medium mb-1">错误信息:</div>&ndash;&gt;-->
    <!--&lt;!&ndash;                <pre>{{ detail.errorMessage }}</pre>&ndash;&gt;-->
    <!--&lt;!&ndash;              </div>&ndash;&gt;-->
    <!--&lt;!&ndash;            </a-timeline-item>&ndash;&gt;-->
    <!--&lt;!&ndash;          </a-timeline>&ndash;&gt;-->
    <!--&lt;!&ndash;        </div>&ndash;&gt;-->
    <!--&lt;!&ndash;      </a-tab-pane>&ndash;&gt;-->
    <!--    </a-tabs>-->
  </BasicModal>
</template>
