import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { ToolStatus } from "~/app/enums/tool-status";
import { Router } from "@angular/router";
import { KeyValuePipe } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";
import { SafePipe } from "~/app/pipes/safe.pipe";

export interface Tool {
  id: string;
  name: string;
  route: string;
  status: ToolStatus;
  icon?: string;
  svgGenerator?: (fill: string) => string;
  group?: string;
}

@Component({
    selector: "app-sidebar",
    templateUrl: "./sidebar.component.html",
    styleUrls: ["./sidebar.component.scss"],
    standalone: true,
    imports: [
        TooltipModule,
        KeyValuePipe,
        SafePipe,
    ],
})
export class SidebarComponent implements OnInit {
  @Input() openInNewPage = true;
  @Input() tools: Tool[] = [];
  @Output() collapsedChange = new EventEmitter<boolean>();

  collapsed = false;

  readonly ToolStatus = ToolStatus;
  selectedTool = '';
  groupedTools: Map<string, Tool[]> = new Map();

  fillColorsMap: Record<string, string> = {};

  constructor(private router: Router) {}

  ngOnInit(): void {
    const url = this.router.url;
    const possibleTool = url.split("/")[1]?.split("?")[0] || '';
    this.selectedTool = possibleTool;

    const colors = {
      disabled: "#bdbdbd",
      active: "#224063",
      normal: "#757575"
    };

    this.fillColorsMap = this.tools.reduce((acc, tool) => {
      acc[tool.id] = tool.status === ToolStatus.DISABLED 
        ? colors.disabled 
        : tool.id === this.selectedTool 
          ? colors.active 
          : colors.normal;
      return acc;
    }, {} as Record<string, string>);

    this.groupTools();
  }

  public toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  private groupTools(): void {
    this.groupedTools = this.tools.reduce((acc, tool) => {
      const group = tool.group || 'default';
      if (!acc.has(group)) {
        acc.set(group, []);
      }
      acc.get(group)?.push(tool);
      return acc;
    }, new Map<string, Tool[]>());
  }
}
