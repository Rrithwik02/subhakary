export type ServiceQuestionType = "text" | "select" | "number" | "date" | "multiselect";

export type ServiceQuestionConfig = {
  key: string;
  label: string;
  type: ServiceQuestionType;
  required: boolean;
  order: number;
  options?: string[];
};

export type WhatsappServiceRequirementRecord = {
  id: string;
  service_slug: string;
  requirement_id: string;
  label: string;
  description?: string | null;
  sort_order: number;
};

export type ServiceCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
};
