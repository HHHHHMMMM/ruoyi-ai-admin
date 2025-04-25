/**
 * 系统数据源配置
 */
export interface SystemDataSourceConfig {
  /**
   * 主键ID
   */
  id?: number;

  /**
   * 系统名称
   */
  systemName: string;

  /**
   * 数据库类型
   */
  dbType: string;

  /**
   * JDBC URL
   */
  jdbcUrl: string;

  /**
   * 用户名
   */
  username: string;

  /**
   * 密码
   */
  password: string;

  /**
   * 驱动类名
   */
  driverClass?: string;

  /**
   * 最大连接数
   */
  maxPoolSize?: number;

  /**
   * 连接超时时间（毫秒）
   */
  connectionTimeout?: number;

  /**
   * 是否启用
   */
  enabled: boolean;

  /**
   * 创建者
   */
  createBy?: string;

  /**
   * 创建时间
   */
  createTime?: string;

  /**
   * 更新者
   */
  updateBy?: string;

  /**
   * 更新时间
   */
  updateTime?: string;

  /**
   * 备注
   */
  remark?: string;

  /**
   * 数据库名
   */
  dbName?: string;
}
