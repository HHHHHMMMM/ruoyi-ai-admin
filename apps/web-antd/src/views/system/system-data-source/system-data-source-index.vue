<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemDataSourceConfig } from '#/api/system/data-source/model.d.ts';

import { Page, useVbenModal } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';

import { Modal, Popconfirm, Space } from 'ant-design-vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '#/adapter/vxe-table';
import {
  dataSourceList,
  dataSourceRemove,
  dataSourceTestConnection,
} from '#/api/system/data-source/api';

import { columns, querySchema } from './data';
import dataSourceModal from './data-source-modal.vue';
import { onMounted } from 'vue';

const formOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 100,
    componentProps: {
      allowClear: true,
    },
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
  },
  columns,
  height: 'auto', // 设置一个固定高度而不是auto
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await dataSourceList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  id: 'knowledge-graph-data-source-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// 组件挂载后手动触发一次查询
onMounted(() => {
  console.log('组件已挂载，即将触发查询');
  tableApi.query();
});

const [DataSourceModal, modalApi] = useVbenModal({
  connectedComponent: dataSourceModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

async function handleEdit(record: SystemDataSourceConfig) {
  modalApi.setData({ id: record.id });
  modalApi.open();
}

async function handleDelete(row: SystemDataSourceConfig) {
  await dataSourceRemove(row.id);
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: SystemDataSourceConfig) => row.id);
  Modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await Promise.all(ids.map((id) => dataSourceRemove(id)));
      await tableApi.query();
    },
  });
}

async function handleTestConnection(row: SystemDataSourceConfig) {
  try {
    console.log('传递的 row 对象:', row); // 新增日志输出

    await dataSourceTestConnection(row);
    Modal.success({
      title: '连接测试成功',
      content: `与数据源 ${row.systemName} 的连接测试成功`,
    });
  } catch (error) {
    Modal.error({
      title: '连接测试失败',
      content: `与数据源 ${row.systemName} 的连接测试失败: ${error.message || error}`,
    });
  }
}
</script>

<template>
  <Page :auto-content-height="true">
    <BasicTable table-title="系统数据源配置">
      <template #toolbar-tools>
        <Space>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
            danger
            type="primary"
            v-access:code="['system:datasource:remove']"
            @click="handleMultiDelete"
          >
            {{ $t('pages.common.delete') }}
          </a-button>
          <a-button
            type="primary"
            v-access:code="['system:datasource:add']"
            @click="handleAdd"
          >
            {{ $t('pages.common.add') }}
          </a-button>
        </Space>
      </template>
      <template #action="{ row }">
        <Space>
          <ghost-button
            v-access:code="['system:datasource:edit']"
            @click="handleEdit(row)"
          >
            {{ $t('pages.common.edit') }}
          </ghost-button>
          <ghost-button
            v-access:code="['system:datasource:test']"
            @click="handleTestConnection(row)"
          >
            测试连接
          </ghost-button>
          <Popconfirm
            :get-popup-container="getVxePopupContainer"
            placement="left"
            title="确认删除？"
            @confirm="handleDelete(row)"
          >
            <ghost-button
              danger
              v-access:code="['system:datasource:remove']"
              @click.stop=""
            >
              {{ $t('pages.common.delete') }}
            </ghost-button>
          </Popconfirm>
        </Space>
      </template>
    </BasicTable>
    <DataSourceModal @reload="tableApi.query()" />
  </Page>
</template>
