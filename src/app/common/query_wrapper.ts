/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings <Suwings@outlook.com>

  该程序是免费软件，您可以重新分发和/或修改据 GNU Affero 通用公共许可证的条款，
  由自由软件基金会，许可证的第 3 版，或（由您选择）任何更高版本。

  根据 AGPL 与用户协议，您必须保留所有版权声明，如果修改源代码则必须开源修改后的源代码。
  可以前往 https://mcsmanager.com/ 阅读用户协议，申请闭源开发授权等。
*/

interface IMap {
  size: number;
  forEach: (value: any, key?: any) => void;
}

interface Page<T> {
  page: number;
  pageSize: number;
  maxPage: number;
  total: number;
  data: T[];
}

// 供给路由层使用的MAP型查询接口
export class QueryMapWrapper {
  constructor(public map: IMap) {}

  select<T>(condition: (v: T) => boolean): T[] {
    const result: T[] = [];
    this.map.forEach((v: T) => {
      if (condition(v)) result.push(v);
    });
    return result;
  }

  page<T>(data: T[], page = 1, pageSize = 10) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    let size = data.length;
    let maxPage = 0;
    while (size > 0) {
      size -= pageSize;
      maxPage++;
    }
    return {
      page,
      pageSize,
      maxPage,
      data: data.slice(start, end)
    };
  }
}

// 供 QueryWrapper 使用的数据源接口
export interface IDataSource<T> {
  selectPage: (condition: any, page: number, pageSize: number) => Page<T>;
  select: (condition: any) => any[];
  update: (condition: any, data: any) => void;
  delete: (condition: any) => void;
  insert: (data: any) => void;
}

// MYSQL 数据源
export class MySqlSource<T> implements IDataSource<T> {
  selectPage: (condition: any, page: number, pageSize: number) => Page<T>;
  select: (condition: any) => any[];
  update: (condition: any, data: any) => void;
  delete: (condition: any) => void;
  insert: (data: any) => void;
}

// 本地文件数据源（内嵌式微型数据库）
export class LocalFileSource<T> implements IDataSource<T> {
  constructor(public data: any) {}

  selectPage(condition: any, page = 1, pageSize = 10) {
    const result: T[] = [];
    this.data.forEach((v: any) => {
      for (const key in condition) {
        const dataValue = v[key];
        const targetValue = condition[key];
        if (targetValue[0] == "%") {
          if (!dataValue.includes(targetValue.slice(1, targetValue.length - 1))) return false;
        } else {
          if (targetValue !== dataValue) return false;
        }
      }
      result.push(v);
    });
    return this.page(result, page, pageSize);
  }

  page(data: T[], page = 1, pageSize = 10) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    let size = data.length;
    let maxPage = 0;
    while (size > 0) {
      size -= pageSize;
      maxPage++;
    }
    return {
      page,
      pageSize,
      maxPage,
      total: data.length,
      data: data.slice(start, end)
    };
  }

  select(condition: any): any[] {
    return null;
  }
  update(condition: any, data: any) {}
  delete(condition: any) {}
  insert(data: any) {}
}

// 供给路由层使用的统一数据查询接口
export class QueryWrapper<T> {
  constructor(public dataSource: IDataSource<T>) {}

  selectPage(condition: any, page = 1, pageSize = 10) {
    return this.dataSource.selectPage(condition, page, pageSize);
  }
}
