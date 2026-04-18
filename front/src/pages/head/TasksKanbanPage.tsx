import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";

export function TasksKanbanPage() {
  return (
    <HeadDesktopLayout currentPath="/head/tasks">
      <div className="mx-auto w-full space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage tasks for inspectors
            </p>
          </div>
          <Button>Create Task</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">Pending</h3>
              <p className="text-sm text-muted-foreground">0 tasks</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                No tasks in this status
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">In Progress</h3>
              <p className="text-sm text-muted-foreground">0 tasks</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                No tasks in this status
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">Completed</h3>
              <p className="text-sm text-muted-foreground">0 tasks</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                No tasks in this status
              </p>
            </div>
          </div>
        </div>
      </div>
    </HeadDesktopLayout>
  );
}
