/**
 * 需求注册表结构定义
 * 用户可见业务逻辑正文以 logicSections 为唯一来源。
 */

export type RequirementObjectType =
  | 'field'
  | 'copy'
  | 'button'
  | 'region'
  | 'dialog'
  | 'panel'
  | 'tab'
  | 'step'
  | 'state'
  | 'data';

export type AnchorStatus = 'implemented' | 'planned';

export type RequirementSourceType = 'code' | 'decision' | 'code+decision';

export interface ActivationStep {
  type: 'navigate' | 'openPanel' | 'openDialog' | 'setStep' | 'setTab' | 'scrollTo' | 'highlight';
  label: string;
  to?: string;
  panel?: string;
  dialog?: string;
  step?: string;
  tab?: string;
  anchorId?: string;
}

export interface LogicSection {
  /** 一级标题；由规则归类产生 */
  title: string;
  /** 业务规则条目；每条一个可验收事实 */
  items: string[];
}

export interface RequirementSource {
  decisionFile: string;
  decisionObject: string;
  relatedFiles: string[];
}

export interface RequirementItem {
  id: string;
  title: string;
  sourceType: RequirementSourceType;
  objectType: RequirementObjectType;
  objectName: string;
  module: string;
  pageName: string;
  route: string;
  anchorId: string;
  anchorStatus: AnchorStatus;
  activate: ActivationStep[];
  logicSections: LogicSection[];
  acceptance: string[];
  source: RequirementSource;
}

export interface ExcludedDecision {
  objectName: string;
  reason: string;
  sourceDecision: string;
}

export interface RequirementRegistry {
  registryId: string;
  pageName: string;
  route: string;
  module: string;
  description: string;
  sourceDecisionFile: string;
  relatedFiles: string[];
  requirements: RequirementItem[];
  excludedDecisions: ExcludedDecision[];
}
