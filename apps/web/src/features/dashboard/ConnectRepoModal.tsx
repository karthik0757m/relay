import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, Github, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "@/components/ui/status-pill";
import { useCreateProject } from "@/lib/api/hooks";
import { routes } from "@/lib/routes";
import { useSyncPolling } from "@/features/projects/useSyncPolling";

/* ── Post-connect sync progress panel ─────────────────────────── */

function SyncProgressPanel({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const { data: job } = useSyncPolling(projectId);
  const navigate = useNavigate();

  const isFailed = job?.status === "failed";
  const isDone = job?.status === "succeeded";

  useEffect(() => {
    if (isDone) {
      const t = setTimeout(() => {
        onDone();
        navigate(routes.project(projectId).root());
      }, 800);
      return () => clearTimeout(t);
    }
  }, [isDone, projectId, onDone, navigate]);

  return (
    <div className="space-y-4 py-2" aria-live="polite" aria-atomic="true">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-text-muted">
          {isFailed ? "Indexing failed" : isDone ? "Indexing complete!" : "Indexing repository…"}
        </span>
        <StatusPill
          status={isFailed ? "error" : isDone ? "healthy" : "indexing"}
        >
          {isFailed ? "Failed" : isDone ? "Healthy" : `${job?.progress ?? 0}%`}
        </StatusPill>
      </div>

      <Progress
        value={job?.progress ?? 0}
        variant="copper"
        aria-label={`Indexing progress: ${job?.progress ?? 0}%`}
      />

      {isFailed && (
        <div className="flex items-start gap-2 rounded border border-error/30 bg-error/10 p-3 text-xs text-error">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {job?.error ?? "Indexing failed. Please retry or check the repository."}{" "}
            <button
              type="button"
              className="underline hover:no-underline font-medium"
              onClick={onDone}
            >
              Dismiss
            </button>
          </span>
        </div>
      )}

      {isDone && (
        <p className="text-xs text-success font-mono">
          Repository indexed successfully. Redirecting…
        </p>
      )}
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────────── */

const SAMPLE_REPOS = ["shadcn-ui/ui", "facebook/react", "tailwindlabs/tailwindcss"];
const LANGUAGES = ["TypeScript", "Rust", "Python", "Go", "JavaScript"];

export function ConnectRepoModal() {
  const [open, setOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [connectedProjectId, setConnectedProjectId] = useState<string | null>(null);

  const createProject = useCreateProject();

  const handleClose = () => {
    setOpen(false);
    setConnectedProjectId(null);
    setRepoName("");
    setDescription("");
    setLanguage("TypeScript");
    createProject.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;
    createProject.mutate(
      {
        fullName: repoName.trim(),
        description: description.trim() || "Connected via Relay",
        language,
      },
      {
        onSuccess: (proj) => setConnectedProjectId(proj.id),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogTrigger asChild>
        <Button
          variant="primary"
          size="sm"
          className="gap-2 bg-copper hover:bg-copper-dark text-paper"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Connect Repository
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-charcoal border-border text-paper">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Github className="h-5 w-5 text-copper" aria-hidden="true" />
            <DialogTitle className="text-lg font-serif">
              Connect GitHub Repository
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-text-muted">
            Relay indexes your codebase into commits, PRs, and AST evidence for
            instant reasoning.
          </DialogDescription>
        </DialogHeader>

        {/* Sync progress (shown after POST succeeds) */}
        {connectedProjectId ? (
          <SyncProgressPanel
            projectId={connectedProjectId}
            onDone={handleClose}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="repoName"
                className="text-xs font-mono uppercase text-text-muted"
              >
                Repository (owner/repo)
              </Label>
              <Input
                id="repoName"
                placeholder="e.g. vercel/next.js"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="bg-surface-accent border-border text-paper text-sm font-mono"
                required
                aria-required="true"
              />
              <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                <span className="text-[10px] text-text-muted">Suggestions:</span>
                {SAMPLE_REPOS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setRepoName(s)}
                    className="text-[10px] font-mono text-copper hover:underline"
                  >
                    {s.split("/")[1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-xs font-mono uppercase text-text-muted"
              >
                Brief Description
              </Label>
              <Input
                id="description"
                placeholder="What does this repo do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-surface-accent border-border text-paper text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="language"
                className="text-xs font-mono uppercase text-text-muted"
              >
                Primary Language
              </Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded border border-border bg-surface-accent px-3 py-2 text-xs font-mono text-paper focus:outline-none focus:ring-1 focus:ring-copper"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {createProject.isError && (
              <p role="alert" className="text-xs text-error font-mono">
                {createProject.error instanceof Error
                  ? createProject.error.message
                  : "Failed to connect repository. Please try again."}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClose}
                disabled={createProject.isPending}
                className="border-border text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createProject.isPending || !repoName.trim()}
                loading={createProject.isPending}
                className="bg-copper hover:bg-copper-dark text-paper text-xs"
              >
                {createProject.isPending ? "Connecting…" : "Index & Connect"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
