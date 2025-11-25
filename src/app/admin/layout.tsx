
import { isDbConfigured } from '@/lib/db';
import AdminPage from './page';


export default function AdminLayout() {
    // This is a server component, so isDbConfigured will have the correct server-side value.
    return <AdminPage dbConnected={isDbConfigured} />;
}
