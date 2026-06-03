import { APP_TEMPLATE_HEADER_MARKUP } from "./appTemplateHeaderMarkup";
import { APP_TEMPLATE_CANVAS_MARKUP } from "./appTemplateCanvasMarkup";
import { APP_TEMPLATE_PROPERTIES_SIDEBAR_MARKUP } from "./appTemplatePropertiesSidebarMarkup";
import { APP_TEMPLATE_MODALS_MARKUP } from "./appTemplateModalsMarkup";

export function renderAppTemplate(root) {
  root.innerHTML =
    APP_TEMPLATE_HEADER_MARKUP +
    APP_TEMPLATE_CANVAS_MARKUP +
    APP_TEMPLATE_PROPERTIES_SIDEBAR_MARKUP +
    APP_TEMPLATE_MODALS_MARKUP;
}
