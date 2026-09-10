import { useState, type ReactNode } from "react";
import { useScientificRecords } from "../api/hooks";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { DataRequirement } from "../components/common/DataRequirement";
import { DqiSummary } from "../components/common/DqiSummary";
import { EvidenceSummary } from "../components/common/EvidenceSummary";
import { Pagination } from "../components/common/Pagination";
import { RecordTable } from "../components/common/RecordTable";
import { pageSize } from "../config/constants";

export function ScientificRecordsPage({ title, family, intro, children }: { title: string; family?: string; intro: string; children?: ReactNode }) {
  const [offset, setOffset] = useState(0);
  const query = useScientificRecords(family, pageSize, offset);
  return <section><h1>{title}</h1><p>{intro}</p>{children}
    {query.isLoading && <LoadingState />}{query.isError && <ErrorState error={query.error} />}
    {family === "dqi" && query.data?.items.map(record => <DqiSummary key={record.id} record={record} />)}
    {family && family !== "dqi" && query.data?.items.map(record => <EvidenceSummary key={record.id} record={record} />)}
    {query.data && <>{query.data.items.length === 0 ? <DataRequirement resource={family ?? "scientific-records"} filtered={offset > 0} /> : <RecordTable records={query.data.items} />}<Pagination offset={query.data.offset} limit={query.data.limit} count={query.data.items.length} onChange={setOffset} /></>}
  </section>;
}
