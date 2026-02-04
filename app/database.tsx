import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

async function TableData() {
  // query the "tableName" table using REST API
  // SQL to REST translator: https://supabase.com/docs/guides/api/sql-to-rest 
  const { data: tableName, error } =
    await supabase.from("tableName").select();//SELECT * FROM "tableName";

  if (error) {
    return <pre>{error.message}</pre>;
  }

  return <pre>{JSON.stringify(tableName, null, 2)}</pre>;
}

export default function Table() {
  return (
    <Suspense fallback={<div>Loading instruments...</div>}>
      <TableData />
    </Suspense>
  );
}



