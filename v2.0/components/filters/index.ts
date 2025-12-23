/**
 * @id FILTER-INDEX-001
 * @name Filter Components Index
 * @description Barrel exports for all filter components
 */

// Core filter bar components
export { LocalFilterBar, createDefaultLocalFilters, countActiveFilters, applyLocalFilters } from './LocalFilterBar';
export type { LocalFilters } from './LocalFilterBar';

// Individual filter selectors
export { TagSelector } from './TagSelector';
export type { TagSelectorProps } from './TagSelector';

export { StatusSelector } from './StatusSelector';
export type { StatusSelectorProps } from './StatusSelector';

export { AssigneeSelector } from './AssigneeSelector';
export type { AssigneeSelectorProps } from './AssigneeSelector';

export { DateRangePicker } from './DateRangePicker';
export type { DateRangePickerProps, DateRange } from './DateRangePicker';
