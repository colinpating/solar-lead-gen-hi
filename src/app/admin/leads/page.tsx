import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { getAdminLeadRows } from '@/lib/leadQueries';

type SearchParams = Promise<{ page?: string; zip?: string; lead_status?: string; homeowner_status?: string }>;

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  const params = await searchParams;
  const page = Number.parseInt(params.page ?? '1', 10) || 1;
  const pageSize = 25;

  const { rows, total } = await getAdminLeadRows({
    page,
    pageSize,
    zip: params.zip,
    lead_status: params.lead_status,
    homeowner_status: params.homeowner_status
  });

  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="admin-page">
      <header>
        <h1>Lead Dashboard</h1>
        <a href="/api/admin/leads/export.csv">Export CSV</a>
      </header>
      <p>
        {total} total leads | page {page} of {maxPage}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Created</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Best Time</th>
              <th>Owner</th>
              <th>Bill</th>
              <th>Timeline</th>
              <th>Status</th>
              <th>Consent</th>
              <th>Enrichment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>
                  {row.first_name} {row.last_name}
                </td>
                <td>{row.phone}</td>
                <td>{row.email}</td>
                <td>
                  {row.street_address}, {row.city}, {row.state} {row.zip}
                </td>
                <td>{row.best_time_to_contact}</td>
                <td>{row.homeowner_status ?? '-'}</td>
                <td>{row.monthly_electric_bill_range ?? '-'}</td>
                <td>{row.timeline_to_install ?? '-'}</td>
                <td>{row.lead_status}</td>
                <td>{row.consent_contact && row.consent_privacy ? 'Yes' : 'No'}</td>
                <td>
                  {row.enrichment_status ?? '-'}
                  <br />
                  {row.home_value_estimate ? `Tract: $${row.home_value_estimate.toLocaleString()}` : 'No tract value'}
                  {row.rentcast_value_estimate ? ` | Property: $${row.rentcast_value_estimate.toLocaleString()}` : ''}
                  <details>
                    <summary>Details</summary>
                    <div>
                      <div>Consent time: {row.consent_timestamp ?? '-'}</div>
                      <div>Consent version: {row.consent_text_version ?? '-'}</div>
                      <div>IP: {row.ip_address ?? '-'}</div>
                      <div>User agent: {row.user_agent ?? '-'}</div>
                      <div>Tract: {row.census_tract ?? '-'}</div>
                      <div>County: {row.county ?? '-'}</div>
                      <div>Property type: {row.property_type ?? '-'}</div>
                      <div>Last sale date: {row.last_sale_date ?? '-'}</div>
                      <div>Sq ft: {row.square_footage ?? '-'}</div>
                      <div>Year built: {row.year_built ?? '-'}</div>
                      <div>Beds/Baths: {row.bedrooms ?? '-'}/{row.bathrooms ?? '-'}</div>
                      <div>Lot size: {row.lot_size ?? '-'}</div>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        {page > 1 ? <a href={`/admin/leads?page=${page - 1}`}>Previous</a> : <span />}
        {page < maxPage ? <a href={`/admin/leads?page=${page + 1}`}>Next</a> : <span />}
      </div>
    </main>
  );
}
