import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

async function TableData() {
  //*********** Query ********************/
  // * Example: query the "tableName" table using REST API
  // * SQL to REST translator: https://supabase.com/docs/guides/api/sql-to-rest 
  // *********************************************/

  const { data: tableNameData, error: tableNameError } = await supabase
    .from("tableName")
    .select();         // SELECT * FROM "tableName";
//--------------------------------------------------------------

  // Example for future tables:
  // const { data: table2Data, error: table2Error } = await supabase
  //   .from("table2")
  //   .select(); // SELECT * FROM "table2";
//--------------------------------------------------------------

  //  add more tables as needed
  // ...
//--------------------------------------------------------------

//********** Handle errors ************************
// * if any error occurs during the data fetching, it will be captured here
//**************************************************/

  if (tableNameError) {
    return <pre>{`TableName error: ${tableNameError.message}`}</pre>;
  }
  //--------------------------------------------------------------
  // if (table2Error) {
  //   return <pre>{`Table2 error: ${table2Error.message}`}</pre>;
  // }
  //--------------------------------------------------------------

  // more error handling as needed
  // ...
  //--------------------------------------------------------------

//********** Render Data ****************************/
// * Display the fetched data from Supabase in JSON format
// *****************************************************/
  return (
    <div>
      <h2>TableName</h2>
      <pre>{JSON.stringify(tableNameData, null, 2)}</pre> {/* converts the data from Supabase into a JSON string. */}
{/*-------------------------------------------------------------*/}
      {/* Future tables goes here */}
      {/* <h2>Table2</h2>
      <pre>{JSON.stringify(table2Data, null, 2)}</pre> */}
{/*-------------------------------------------------------------*/}

      {/* Add more tables as needed */}
      {/*...*/}
    </div>
  );
}


export default function Table() {
  return (
    <Suspense fallback={<div>Loading tables...</div>}>
      <TableData />
    </Suspense>
  );
}



