// Each page's favicon in public/, e.g. "cart" → /cart-favicon.png.
type Favicon = 'home' | 'cart' | 'orders' | 'tracking';

type PageMetaProps = {
    title: string;
    favicon: Favicon;
};

/** Sets the browser tab's title and icon. React moves both into <head>. */
export function PageMeta({ title, favicon }: PageMetaProps) {
    return (
        <>
            <title>{title}</title>
            <link rel="icon" type="image/png" href={`/${favicon}-favicon.png`} />
        </>
    );
}
