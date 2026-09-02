import type { ServiceCategoryRecord } from "../types/service.ts";
import { getServiceQuestions } from "../config/service-question-config.ts";
import { getServiceRequirements } from "../config/service-requirement-config.ts";

export function renderServiceCategories(categories: ServiceCategoryRecord[]) {
  return {
    text: "Please choose a service category:",
    categories,
  };
}

export function renderServiceRequirements(categorySlug: string | null) {
  return {
    text: "Please select the requirements you need. You can choose more than one.",
    questions: getServiceQuestions(categorySlug),
    requirements: getServiceRequirements(categorySlug),
  };
}
