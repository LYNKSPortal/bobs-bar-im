import { ActivityForm } from "@/components/admin/activity-form";

export default function NewActivityPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">Add activity</h1>
      <ActivityForm />
    </div>
  );
}
