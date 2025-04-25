import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { getPopupContainer } from '@vben/utils';
import { h } from 'vue';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'systemName',
    label: '系统名称',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [
        { label: 'MySQL', value: 'mysql' },
        { label: 'Oracle', value: 'oracle' },
        { label: 'PostgreSQL', value: 'postgresql' },
        { label: 'SQL Server', value: 'sqlserver' },
      ],
    },
    fieldName: 'dbType',
    label: '数据库类型',
  },
  {
    component: 'Input',
    fieldName: 'dbName',
    label: '数据库名',
  },
  {
    component: 'Input',
    fieldName: 'jdbcUrl',
    label: 'JDBC URL',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: [
        { label: '启用', value: true },
        { label: '禁用', value: false },
      ],
    },
    fieldName: 'enabled',
    label: '状态',
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '系统名称',
    field: 'systemName',
    width: 150,
  },
  {
    title: '数据库类型',
    field: 'dbType',
    width: 120,
  },
  {
    title: '数据库名',
    field: 'dbName',
    width: 120,
  },
  {
    title: 'JDBC URL',
    field: 'jdbcUrl',
  },
  {
    title: '用户名',
    field: 'username',
    width: 120,
  },
  {
    title: '驱动类',
    field: 'driverClass',
    width: 200,
  },
  {
    title: '最大连接数',
    field: 'maxPoolSize',
    width: 120,
  },
  {
    title: '连接超时 (毫秒)',
    field: 'connectionTimeout',
    width: 150,
  },
  {
    title: '状态',
    field: 'enabled',
    width: 100,
    slots: {
      default: ({ row }) => {
        return row.enabled
          ? h('span', { class: 'text-success' }, '启用')
          : h('span', { class: 'text-error' }, '禁用');
      },
    },
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 250,
  },
];
