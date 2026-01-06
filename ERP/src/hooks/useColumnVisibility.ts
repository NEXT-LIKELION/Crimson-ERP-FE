import { useState, useEffect, useCallback } from 'react';
import { loadColumnVisibility, saveColumnVisibility } from '../utils/localStorage';
import type { TableColumn, ColumnVisibility, TableType } from '../types/tableColumns';

interface UseColumnVisibilityOptions {
  columns: TableColumn[];
  tableType: TableType;
}

export const useColumnVisibility = ({ columns, tableType }: UseColumnVisibilityOptions) => {
  // 초기 표시 상태 생성 (기본값: 모든 컬럼 표시)
  const getInitialVisibility = useCallback((): ColumnVisibility => {
    const stored = loadColumnVisibility(tableType);
    if (stored) {
      // 저장된 설정이 있으면 사용하되, 새로 추가된 컬럼은 기본값으로 추가
      const visibility: ColumnVisibility = {};
      columns.forEach((col) => {
        visibility[col.id] = stored[col.id] ?? col.defaultVisible ?? true;
      });
      return visibility;
    }
    // 저장된 설정이 없으면 기본값 사용
    const visibility: ColumnVisibility = {};
    columns.forEach((col) => {
      visibility[col.id] = col.defaultVisible ?? true;
    });
    return visibility;
  }, [columns, tableType]);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(getInitialVisibility);

  // localStorage에서 설정 로드
  useEffect(() => {
    const stored = loadColumnVisibility(tableType);
    if (stored) {
      const visibility: ColumnVisibility = {};
      columns.forEach((col) => {
        visibility[col.id] = stored[col.id] ?? col.defaultVisible ?? true;
      });
      setColumnVisibility(visibility);
    }
  }, [columns, tableType]);

  // 컬럼 표시/숨김 토글
  const toggleColumn = useCallback(
    (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column || column.required) {
        // 필수 컬럼은 숨길 수 없음
        return;
      }

      setColumnVisibility((prev) => {
        const newVisibility = {
          ...prev,
          [columnId]: !prev[columnId],
        };

        // 최소 1개 이상의 컬럼은 표시되어야 함
        const visibleCount = Object.values(newVisibility).filter((v) => v).length;
        if (visibleCount === 0) {
          // 모든 컬럼을 숨기려고 하면 원래대로 복원
          return prev;
        }

        // localStorage에 저장
        saveColumnVisibility(tableType, newVisibility);
        return newVisibility;
      });
    },
    [columns, tableType]
  );

  // 모든 컬럼 표시
  const showAllColumns = useCallback(() => {
    const visibility: ColumnVisibility = {};
    columns.forEach((col) => {
      visibility[col.id] = true;
    });
    setColumnVisibility(visibility);
    saveColumnVisibility(tableType, visibility);
  }, [columns, tableType]);

  // 기본값으로 복원
  const resetToDefault = useCallback(() => {
    const visibility: ColumnVisibility = {};
    columns.forEach((col) => {
      visibility[col.id] = col.defaultVisible ?? true;
    });
    setColumnVisibility(visibility);
    saveColumnVisibility(tableType, visibility);
  }, [columns, tableType]);

  // 특정 컬럼이 표시되는지 확인
  const isColumnVisible = useCallback(
    (columnId: string) => {
      return columnVisibility[columnId] ?? true;
    },
    [columnVisibility]
  );

  return {
    columnVisibility,
    toggleColumn,
    showAllColumns,
    resetToDefault,
    isColumnVisible,
  };
};

