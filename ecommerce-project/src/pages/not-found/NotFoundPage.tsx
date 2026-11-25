import { Header } from '../../components/Header';
import { PageMeta } from '../../components/PageMeta';
import './NotFoundPage.css';

export function NotFoundPage() {
    return (
        <>
            <PageMeta title="404 Page Not Found" favicon="home" />
            <Header />

            <div className="not-found-message">
                page not found
            </div>
        </>
    );
}
