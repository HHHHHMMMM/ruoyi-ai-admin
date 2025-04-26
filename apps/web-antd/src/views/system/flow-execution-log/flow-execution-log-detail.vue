<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
// 导入Ant Design Vue组件
import { Tabs, TabPane, Timeline, TimelineItem, Tag } from 'ant-design-vue';
import {
  DatabaseOutlined,
  BranchesOutlined,
  MessageOutlined,
} from '@ant-design/icons-vue';

import { flowLogInfo } from '#/api/system/flow-execution-log/flow-execution-log-api';
import type {
  ExecutionStepDetail,
  PathData,
} from '#/api/system/flow-execution-log/flow-execution-log-modal';

// 执行步骤详情
const executionDetails = ref<ExecutionStepDetail[]>([]);
const pathData = ref<PathData>({ nodes: [], edges: [] });

// 切换标签页
const activeKey = ref('2');

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: true,
  title: '流程执行日志详情',
  class: 'w-[1400px]', // 使用class属性设置宽度
  destroyOnClose: true, // 关闭时销毁内容，避免缓存问题

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
        if (record.pathData) {
          console.log('record pathData', record.pathData);
          // 尝试解析JSON字符串
          const parsed =
            typeof record.pathData === 'string'
              ? JSON.parse(record.pathData)
              : record.pathData;

          // 赋值给响应式变量
          pathData.value = parsed;
        }

        if (record.executionDetails) {
          const details =
            typeof record.executionDetails === 'string'
              ? JSON.parse(record.executionDetails)
              : record.executionDetails;

          // 限制数组长度，避免过多数据
          executionDetails.value = Array.isArray(details)
            ? details.slice(0, 100)
            : [];
        }
      } catch (error) {
        console.error('解析JSON字段失败', error);
        pathData.value = { nodes: [], edges: [] };
        executionDetails.value = [];
      }
    }
    modalApi.modalLoading(false);
  },
});
</script>

<template>
  <BasicModal>
    <Tabs v-model:activeKey="activeKey">
      <TabPane key="2" tab="执行详情" v-if="executionDetails.length > 0">
        <div class="p-4">
          <div class="mb-4 text-lg font-bold">执行详情</div>
          <div
            class="max-h-screen min-h-80 overflow-auto rounded border bg-gray-50 p-4"
          >
            <pre class="text-sm">{{
              JSON.stringify(executionDetails, null, 2)
            }}</pre>
          </div>
        </div>
      </TabPane>
      <TabPane key="3" tab="执行步骤" v-if="executionDetails.length > 0">
        <div class="max-h-screen overflow-auto p-4">
          <div class="mb-4 text-lg font-bold">执行步骤详情</div>
          <Timeline class="max-h-96 overflow-auto">
            <TimelineItem
              v-for="(detail, index) in executionDetails"
              :key="index"
              :color="
                detail.errorMessage
                  ? 'red'
                  : detail.operation === 'query'
                    ? 'blue'
                    : detail.operation === 'condition'
                      ? detail.conditionResult
                        ? 'green'
                        : 'orange'
                      : 'gray'
              "
            >
              <template #dot>
                <DatabaseOutlined v-if="detail.operation === 'query'" />
                <BranchesOutlined
                  v-else-if="detail.operation === 'condition'"
                />
                <MessageOutlined v-else-if="detail.operation === 'reply'" />
              </template>

              <div class="font-medium">
                步骤 {{ detail.stepId }} -
                {{
                  detail.operation === 'query'
                    ? '数据查询'
                    : detail.operation === 'condition'
                      ? '条件判断'
                      : detail.operation === 'reply'
                        ? '生成回复'
                        : detail.operation === 'transition'
                          ? '路径转移'
                          : detail.operation
                }}
                <Tag v-if="detail.executionTime" color="blue">{{
                  detail.executionTime
                }}</Tag>
              </div>

              <div
                v-if="detail.sqlStatement"
                class="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs"
              >
                <div class="mb-1 font-medium">SQL语句:</div>
                <pre>{{ detail.sqlStatement }}</pre>

                <div v-if="detail.sqlResult" class="mt-2">
                  <div class="mb-1 font-medium">查询结果:</div>
                  <pre>{{ JSON.stringify(detail.sqlResult, null, 2) }}</pre>
                </div>
              </div>

              <div
                v-if="detail.condition"
                class="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs"
              >
                <div class="mb-1 font-medium">条件表达式:</div>
                <pre>{{ detail.condition }}</pre>

                <div v-if="detail.conditionResult !== undefined" class="mt-1">
                  <div class="font-medium">评估结果:</div>
                  <Tag :color="detail.conditionResult ? 'success' : 'error'">
                    {{ detail.conditionResult ? '满足' : '不满足' }}
                  </Tag>
                </div>

                <div v-if="detail.nextStepId" class="mt-1">
                  <div class="font-medium">下一步:</div>
                  <Tag color="blue">步骤 {{ detail.nextStepId }}</Tag>
                </div>
              </div>

              <div
                v-if="detail.errorMessage"
                class="mt-2 rounded bg-red-50 p-2 text-xs text-red-500"
              >
                <div class="mb-1 font-medium">错误信息:</div>
                <pre>{{ detail.errorMessage }}</pre>
              </div>
            </TimelineItem>
          </Timeline>
        </div>
      </TabPane>
    </Tabs>
  </BasicModal>
</template>

<style scoped>
/* 可以添加一些自定义样式 */
:deep(.large-modal .ant-modal) {
  width: 90% !important;
  max-width: 1400px !important;
}

:deep(.large-modal .ant-modal-content) {
  width: 100%;
}

:deep(.ant-timeline-item-content) {
  margin-bottom: 20px;
}
</style>
