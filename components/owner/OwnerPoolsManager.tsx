"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type PoolEntry = {
  id: string;
  dimension: string;
  value: string;
  weight: number;
  applies_to_industry: string | null;
  is_active: boolean;
};

type Props = {
  initialPools: PoolEntry[];
  dimensions: readonly string[];
  canWrite: boolean;
};

export function OwnerPoolsManager({ initialPools, dimensions, canWrite }: Props) {
  const toast = useToast();
  const [pools, setPools] = useState<PoolEntry[]>(initialPools);
  const [dimension, setDimension] = useState(dimensions[0] ?? "opening");
  const [value, setValue] = useState("");
  const [weight, setWeight] = useState(10);
  const [industry, setIndustry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    if (value.trim().length === 0) {
      toast.show("value required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/owner/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimension,
          value: value.trim(),
          weight,
          applies_to_industry: industry.trim() === "" ? null : industry.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        toast.show(data.error ?? "create failed", "error");
        return;
      }
      if (data.id) {
        setPools((prev) => [
          ...prev,
          {
            id: data.id!,
            dimension,
            value: value.trim(),
            weight,
            applies_to_industry: industry.trim() === "" ? null : industry.trim(),
            is_active: true,
          },
        ]);
      }
      setValue("");
      toast.show("pool entry added", "success");
    } catch {
      toast.show("network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!canWrite) return;
    if (!window.confirm("Delete this universal pool entry?")) return;
    try {
      const res = await fetch(`/api/v1/owner/pools/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "delete failed", "error");
        return;
      }
      setPools((prev) => prev.filter((p) => p.id !== id));
      toast.show("pool entry removed", "success");
    } catch {
      toast.show("network error", "error");
    }
  };

  return (
    <div className="space-y-md">
      {canWrite ? (
        <Card title="Add universal pool entry">
          <form onSubmit={addEntry} className="grid md:grid-cols-4 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-label text-neutral-700">Dimension</label>
              <select
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                className="min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
              >
                {dimensions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="md:col-span-2"
              required
            />
            <Input
              label="Weight"
              type="number"
              min={1}
              max={1000}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
            <Input
              label="Industry (optional)"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="academy / restaurant / blank"
              className="md:col-span-3"
            />
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" loading={submitting}>
                Add entry
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card title="Universal pool entries">
        <div className="overflow-auto">
          <table className="w-full min-w-[56rem]">
            <thead>
              <tr className="text-left text-label text-neutral-700 border-b border-neutral-200">
                <th className="py-sm pr-md">Dimension</th>
                <th className="py-sm pr-md">Value</th>
                <th className="py-sm pr-md">Weight</th>
                <th className="py-sm pr-md">Industry</th>
                <th className="py-sm pr-md">Active</th>
                {canWrite ? <th className="py-sm pr-md">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {pools.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 text-body text-neutral-900">
                  <td className="py-sm pr-md">{p.dimension}</td>
                  <td className="py-sm pr-md max-w-[24rem] truncate">{p.value}</td>
                  <td className="py-sm pr-md">{p.weight}</td>
                  <td className="py-sm pr-md">{p.applies_to_industry ?? "all"}</td>
                  <td className="py-sm pr-md">{p.is_active ? "yes" : "no"}</td>
                  {canWrite ? (
                    <td className="py-sm pr-md">
                      <Button size="sm" variant="danger" onClick={() => removeEntry(p.id)}>
                        Delete
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
