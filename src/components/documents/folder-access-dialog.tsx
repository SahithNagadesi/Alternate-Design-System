"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

interface AccessGrant {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
  createdAt: string;
}

interface FolderAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
}

export function FolderAccessDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
}: FolderAccessDialogProps) {
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchGrants();
    }
  }, [open, folderId]);

  async function fetchGrants() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/folders/${folderId}/access`);
      if (res.ok) {
        setGrants(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setGranting(true);
    try {
      const res = await fetch(`/api/documents/folders/${folderId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to grant access");
      }

      toast.success(`Access granted to ${email.trim()}`);
      setEmail("");
      fetchGrants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grant access");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke(userId: string, userName: string | null) {
    if (!confirm(`Revoke access for ${userName || "this user"}?`)) return;

    try {
      const res = await fetch(`/api/documents/folders/${folderId}/access/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to revoke access");
      }

      toast.success("Access revoked");
      setGrants((prev) => prev.filter((g) => g.userId !== userId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke access");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Access</DialogTitle>
          <DialogDescription>
            Control who can access &ldquo;{folderName}&rdquo;. Only users with access can view and upload to this private folder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGrant} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="access-email" className="sr-only">
              Email
            </Label>
            <Input
              id="access-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={granting || !email.trim()} size="sm" className="shrink-0">
            {granting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-1 h-4 w-4" />
            )}
            Grant
          </Button>
        </form>

        <div className="max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : grants.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No users have been granted access yet.
            </p>
          ) : (
            <div className="space-y-1">
              {grants.map((grant) => (
                <div
                  key={grant.id}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {grant.user.name || grant.user.email}
                    </p>
                    {grant.user.name && (
                      <p className="truncate text-xs text-muted-foreground">{grant.user.email}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevoke(grant.userId, grant.user.name)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
