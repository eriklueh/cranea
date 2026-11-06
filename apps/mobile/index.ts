/**
 * Entrada de la app: la de expo-router y, en Android, la tarea en segundo plano del widget
 * «Diarios de hoy» (corre sin abrir la app; ver src/widget).
 */
import "expo-router/entry";
import { widgetTaskHandler } from "@/widget";
import { widgetModule } from "@/widget/module";

widgetModule()?.registerWidgetTaskHandler(widgetTaskHandler);
